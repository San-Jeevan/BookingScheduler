using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Kantinebooking.Database
{
    public enum BookingSlot
    {
        Takeaway,
        Slot1,
        Slot2,
        Slot3,
        Slot4
    }


    public class Booking
    {
        public int Id { get; set; }

        public string UserId { get; set; }

        public string Name { get; set; }

        public BookingSlot Timeslot { get; set; }

        public DateTime BookingDay { get; set; }

        public DateTime BookingModified { get; set; }

    }
}
