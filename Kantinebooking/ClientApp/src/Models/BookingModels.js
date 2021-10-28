"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var BookingSlotType;
(function (BookingSlotType) {
    BookingSlotType[BookingSlotType["Takeaway"] = 0] = "Takeaway";
    BookingSlotType[BookingSlotType["Slot1"] = 1] = "Slot1";
    BookingSlotType[BookingSlotType["Slot2"] = 2] = "Slot2";
    BookingSlotType[BookingSlotType["Slot3"] = 3] = "Slot3";
    BookingSlotType[BookingSlotType["Slot4"] = 4] = "Slot4";
})(BookingSlotType = exports.BookingSlotType || (exports.BookingSlotType = {}));
//backend klasser
var AbstractResponse = /** @class */ (function () {
    function AbstractResponse() {
    }
    return AbstractResponse;
}());
exports.AbstractResponse = AbstractResponse;
var Bookingday = /** @class */ (function () {
    function Bookingday() {
    }
    return Bookingday;
}());
exports.Bookingday = Bookingday;
var GetBookingsResponse = /** @class */ (function (_super) {
    __extends(GetBookingsResponse, _super);
    function GetBookingsResponse() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return GetBookingsResponse;
}(AbstractResponse));
exports.GetBookingsResponse = GetBookingsResponse;
var GetTokenResponse = /** @class */ (function (_super) {
    __extends(GetTokenResponse, _super);
    function GetTokenResponse() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return GetTokenResponse;
}(AbstractResponse));
exports.GetTokenResponse = GetTokenResponse;
var Booking = /** @class */ (function () {
    function Booking() {
    }
    return Booking;
}());
exports.Booking = Booking;
//front end
var OnClickBooking = /** @class */ (function () {
    function OnClickBooking() {
    }
    return OnClickBooking;
}());
exports.OnClickBooking = OnClickBooking;
//TODO: i bruk??
var Participant = /** @class */ (function () {
    function Participant() {
    }
    return Participant;
}());
exports.Participant = Participant;
var BookingSlot = /** @class */ (function () {
    function BookingSlot() {
        this.bookedbyme = false;
        this.participants = [];
    }
    return BookingSlot;
}());
exports.BookingSlot = BookingSlot;
var ScheduleDay = /** @class */ (function () {
    function ScheduleDay() {
    }
    return ScheduleDay;
}());
exports.ScheduleDay = ScheduleDay;
var ScheduleWeek = /** @class */ (function () {
    function ScheduleWeek(days) {
        for (var _i = 0, days_1 = days; _i < days_1.length; _i++) {
            var day = days_1[_i];
            var dayinnumber = day.isoWeekday();
            var scheduleDay = new ScheduleDay();
            scheduleDay.day = day;
            scheduleDay.bookingslot0 = new BookingSlot();
            scheduleDay.bookingslot1 = new BookingSlot();
            scheduleDay.bookingslot2 = new BookingSlot();
            scheduleDay.bookingslot3 = new BookingSlot();
            scheduleDay.bookingslot4 = new BookingSlot();
            switch (dayinnumber) {
                case 1: {
                    this.monday = scheduleDay;
                    break;
                }
                case 2: {
                    this.tuesday = scheduleDay;
                    break;
                }
                case 3: {
                    this.wednesday = scheduleDay;
                    break;
                }
                case 4: {
                    this.thursday = scheduleDay;
                    break;
                }
                case 5: {
                    this.friday = scheduleDay;
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }
    return ScheduleWeek;
}());
exports.ScheduleWeek = ScheduleWeek;
//# sourceMappingURL=BookingModels.js.map