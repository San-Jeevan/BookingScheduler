using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using JWT.Algorithms;
using JWT.Builder;
using Kantinebooking.Database;
using Kantinebooking.Helpers;
using Kantinebooking.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Kantinebooking.Controllers
{
    [Route("api/booking")]
    public class BookingController : Controller
    {
        private IConfiguration _configuration;
        private ILogger _logger;
        private ITokenValidator _tokenValidator;
        private BookingDBContext _bookingDBContext;
        private IEnumerable<string> _adminUsers;


        public BookingController(IConfiguration configuration,  ILoggerFactory loggerFactory, BookingDBContext bookingDBContext, ITokenValidator tokenValidator)
        {
            _configuration = configuration;
            _logger = loggerFactory.CreateLogger("BookingController");
            _bookingDBContext = bookingDBContext;
            _tokenValidator = tokenValidator;
            var adminUsers = _configuration.GetSection("AdminUsers").GetChildren();
            _adminUsers = adminUsers.AsEnumerable().Select(x => x.Value.ToLower());
        }

        [TypeFilter(typeof(JWTMiddleware))]
        [Route("book")]
        [HttpPost]
        public async Task<AbstractResponse> Book([FromBody]BookingRequest req)
        {
            _logger.LogInformation($"Adding booking for {req.UserId} ({req.Name}) on {req.BookingDay.Date} {req.Timeslot}");
            var appToken = HttpContext.Request.Headers["Token"];
            var validationresponse = _tokenValidator.ValidateAppToken(appToken);
            req.Name = validationresponse.Name;
            req.UserId = validationresponse.UserName;

            var otherBookingsSameDay = await _bookingDBContext.Bookings.Where(x => x.UserId == req.UserId && x.BookingDay == req.BookingDay.Date).ToListAsync();

            if (req.Timeslot == BookingSlot.Takeaway && req.BookingDay.Date < DateTime.Today.AddDays(1) && otherBookingsSameDay.Count == 0)
            {
                return new AbstractResponse() { Success = false, Message = "Takeaway bestillinger må gjøres før midnatt" };
            }


            if (req.BookingDay.Date < DateTime.Today)
            {
                return new AbstractResponse() { Success = false, Message = "Kan ikke bestille tilbake i tid" };
            }

            var doesItAlreadyExist = await _bookingDBContext.Bookings.FirstOrDefaultAsync<Booking>(x => x.UserId == req.UserId && x.BookingDay == req.BookingDay.Date && x.Timeslot == req.Timeslot);
            if(doesItAlreadyExist != null)
            {
                return new AbstractResponse() {Success = false, Message = "Du har allerede reservert denne plassen" };
            }
            var isItFull = _bookingDBContext.Bookings.Where(x=> x.BookingDay == req.BookingDay.Date && x.Timeslot == req.Timeslot).Count() >= 60;
            if (isItFull)
            {
                return new AbstractResponse() { Success = false, Message = "Ingen ledige plasser nå, det kan hende noen avbestiller. sjekk igjen senere" };
            }

         

            if (req.BookingDay.Date == DateTime.Today && otherBookingsSameDay.Count==0)
            {
                return new AbstractResponse() { Success = false, Message = "Fristen for bestilling av mat/plass er midnatt. Plasser kan byttes på samme dag gitt at det allerede er bestilt mat" };
            }

  
            if (otherBookingsSameDay != null)
            {
                foreach (var booking in otherBookingsSameDay)
                {
                    _bookingDBContext.Bookings.Attach(booking);
                    _bookingDBContext.Bookings.Remove(booking);
                    await _bookingDBContext.SaveChangesAsync();
                }
            }

            var newbooking = new Booking();
            newbooking.BookingDay = req.BookingDay.Date;
            newbooking.BookingModified = DateTime.Now;
            newbooking.Name = req.Name;
            newbooking.UserId = req.UserId;
            newbooking.Timeslot = req.Timeslot;
            _bookingDBContext.Bookings.Add(newbooking);
            await _bookingDBContext.SaveChangesAsync();

            return new AbstractResponse() { Message = "Booking opprettet!" };
        }

        [TypeFilter(typeof(JWTMiddleware))]
        [Route("cancel")]
        [HttpPost]
        public async Task<AbstractResponse> CancelBooking([FromBody]BookingRequest req)
        {
            _logger.LogInformation($"Cancelling booking for {req.UserId} ({req.Name}) on {req.BookingDay.Date} {req.Timeslot}");
            var appToken = HttpContext.Request.Headers["Token"];
            var validationresponse = _tokenValidator.ValidateAppToken(appToken);
            req.Name = validationresponse.Name;
            req.UserId = validationresponse.UserName;

            if (req.BookingDay.Date == DateTime.Today)
            {
                return new AbstractResponse() { Success = false, Message = "Avbestillinger kan ikke gjøres samme dag, men du kan bytte til takeaway" };
            }

            if (req.BookingDay.Date < DateTime.Today)
            {
                return new AbstractResponse() { Success = false, Message = "Kan ikke endre tilbake i tid" };
            }

            var booking = await _bookingDBContext.Bookings.FirstOrDefaultAsync<Booking>(x => x.UserId == req.UserId && x.Timeslot == req.Timeslot && x.BookingDay == req.BookingDay.Date);
            if(booking != null)
            {
                _bookingDBContext.Bookings.Attach(booking);
                _bookingDBContext.Bookings.Remove(booking);
                await _bookingDBContext.SaveChangesAsync();
                return new AbstractResponse() { Message = $"Slettet reservasjon: {booking.Timeslot}" };
            }
            else
            {
                return new AbstractResponse() {Success = false, Message = $"Fant ikke reservasjon for id: {req.Id}" };
            }
        }


        [Route("GetToken")]
        [HttpPost]
        public async  Task<GetTokenResponse> GetToken([FromBody]GetTokenRequest req)
        {
            var tokenresp = await _tokenValidator.ValidateMSToken(req.MSToken);
            if (!tokenresp.Success) return tokenresp;

            var token = new JwtBuilder()
            .WithAlgorithm(new HMACSHA256Algorithm())
            .WithSecret(_configuration["JWTsecretkey"])
            .AddClaim("exp", DateTimeOffset.UtcNow.AddDays(90).ToUnixTimeSeconds())
            .AddClaim("username", tokenresp.UserName)
            .AddClaim("name", tokenresp.Name).Encode();

            return new GetTokenResponse() { Token = token, Name = tokenresp.Name, UserName = tokenresp.UserName};
        }

        [TypeFilter(typeof(JWTMiddleware))]
        [Route("getbookings")]
        [HttpGet]
        public GetBookingsResponse GetBookings(int weekNumber)
        {
            if (weekNumber > 52) weekNumber = 1;
            var response = new List<DateTime>();
            var monday = DateTimeHelper.FirstDateOfWeekISO(DateTime.Now.Year, weekNumber);
            var tuesday = monday.AddDays(1);
            var wednesday = monday.AddDays(2);
            var thursday = monday.AddDays(3);
            var friday = monday.AddDays(4);

            var appToken = HttpContext.Request.Headers["Token"];
            var validationresponse = _tokenValidator.ValidateAppToken(appToken);
            var isAdminUser = _adminUsers.Contains(validationresponse.UserName.ToLower());
            //var isAdminUser = true;

            var resp = new GetBookingsResponse();

            var mondayList = _bookingDBContext.Bookings.Where(x => x.BookingDay == monday).ToList();
            resp.Monday = new BookingDay();
            resp.Monday.Day = monday.Date.ToString("MMM dd");
            resp.Monday.DayEUFormat = monday.Date.ToString("dd.MM.yyyy");
            resp.Monday.Slot0 = mondayList.Where(x => x.Timeslot == BookingSlot.Takeaway).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Monday.Slot1 = mondayList.Where(x => x.Timeslot == BookingSlot.Slot1).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Monday.Slot2 = mondayList.Where(x => x.Timeslot == BookingSlot.Slot2).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Monday.Slot3 = mondayList.Where(x => x.Timeslot == BookingSlot.Slot3).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Monday.Slot4 = mondayList.Where(x => x.Timeslot == BookingSlot.Slot4).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();

            var tuesdayList = _bookingDBContext.Bookings.Where(x => x.BookingDay == tuesday).ToList();
            resp.Tuesday = new BookingDay();
            resp.Tuesday.Day = tuesday.Date.ToString("MMM dd");
            resp.Tuesday.DayEUFormat = tuesday.Date.ToString("dd.MM.yyyy");
            resp.Tuesday.Slot0 = tuesdayList.Where(x => x.Timeslot == BookingSlot.Takeaway).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Tuesday.Slot1 = tuesdayList.Where(x => x.Timeslot == BookingSlot.Slot1).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Tuesday.Slot2 = tuesdayList.Where(x => x.Timeslot == BookingSlot.Slot2).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Tuesday.Slot3 = tuesdayList.Where(x => x.Timeslot == BookingSlot.Slot3).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Tuesday.Slot4 = tuesdayList.Where(x => x.Timeslot == BookingSlot.Slot4).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();


            var wednesdayList = _bookingDBContext.Bookings.Where(x => x.BookingDay == wednesday).ToList();
            resp.Wednesday = new BookingDay();
            resp.Wednesday.Day = wednesday.Date.ToString("MMM dd");
            resp.Wednesday.DayEUFormat = wednesday.Date.ToString("dd.MM.yyyy");
            resp.Wednesday.Slot0 = wednesdayList.Where(x => x.Timeslot == BookingSlot.Takeaway).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Wednesday.Slot1 = wednesdayList.Where(x => x.Timeslot == BookingSlot.Slot1).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Wednesday.Slot2 = wednesdayList.Where(x => x.Timeslot == BookingSlot.Slot2).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Wednesday.Slot3 = wednesdayList.Where(x => x.Timeslot == BookingSlot.Slot3).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Wednesday.Slot4 = wednesdayList.Where(x => x.Timeslot == BookingSlot.Slot4).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();

            var thursdayList = _bookingDBContext.Bookings.Where(x => x.BookingDay == thursday).ToList();
            resp.Thursday = new BookingDay();
            resp.Thursday.Day = thursday.Date.ToString("MMM dd");
            resp.Thursday.DayEUFormat = thursday.Date.ToString("dd.MM.yyyy");
            resp.Thursday.Slot0 = thursdayList.Where(x => x.Timeslot == BookingSlot.Takeaway).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Thursday.Slot1 = thursdayList.Where(x => x.Timeslot == BookingSlot.Slot1).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Thursday.Slot2 = thursdayList.Where(x => x.Timeslot == BookingSlot.Slot2).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Thursday.Slot3 = thursdayList.Where(x => x.Timeslot == BookingSlot.Slot3).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Thursday.Slot4 = thursdayList.Where(x => x.Timeslot == BookingSlot.Slot4).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();


            var fridayList = _bookingDBContext.Bookings.Where(x => x.BookingDay == friday).ToList();
            resp.Friday = new BookingDay();
            resp.Friday.Day = friday.Date.ToString("MMM dd");
            resp.Friday.DayEUFormat = friday.Date.ToString("dd.MM.yyyy");
            resp.Friday.Slot0 = fridayList.Where(x => x.Timeslot == BookingSlot.Takeaway).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Friday.Slot1 = fridayList.Where(x => x.Timeslot == BookingSlot.Slot1).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Friday.Slot2 = fridayList.Where(x => x.Timeslot == BookingSlot.Slot2).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Friday.Slot3 = fridayList.Where(x => x.Timeslot == BookingSlot.Slot3).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();
            resp.Friday.Slot4 = fridayList.Where(x => x.Timeslot == BookingSlot.Slot4).Select(y => isAdminUser ? new Booking() { UserId = y.UserId, Name = y.Name }: new Booking() { UserId = y.UserId } ).ToList();


            return resp;
        }
    }
}
