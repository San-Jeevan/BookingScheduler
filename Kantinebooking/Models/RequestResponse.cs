using Kantinebooking.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Kantinebooking.Models
{
    public class RequestResponse
    {
    }


    public class AbstractResponse
    {
        public AbstractResponse()
        {
            this.Success = true;
        }
        public bool Success { get; set; }
        public string Message { get; set; }
        public List<string> ErrorLog { get; set; }
    }



    public class BookingDay
    {
        public string Day { get; set; }
        public string DayEUFormat { get; set; }

        public List<Booking> Slot0 { get; set; }
        public List<Booking> Slot1 { get; set; }
        public List<Booking> Slot2 { get; set; }
        public List<Booking> Slot3 { get; set; }
        public List<Booking> Slot4 { get; set; }
    }
    
    public class GetBookingsResponse: AbstractResponse
    {
        public BookingDay Monday { get; set; }
        public BookingDay Tuesday { get; set; }
        public BookingDay Wednesday { get; set; }
        public BookingDay Thursday { get; set; }
        public BookingDay Friday { get; set; }
    }

    public class GetTokenResponse: AbstractResponse
    {
        public string Token { get; set; }
        public string UserName { get; set; }
        public string Name { get; set; }

    }

    public class GetTokenRequest
    {
        public string MSToken { get; set; }
    }
    public class BookingRequest : Booking  {

    }
}
