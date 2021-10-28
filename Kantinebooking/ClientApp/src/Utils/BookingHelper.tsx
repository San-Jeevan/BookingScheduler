import { ScheduleWeek, ScheduleDay, Participant, BookingSlot, BookingSlotType, Booking } from '../Models/BookingModels';

import moment from 'moment';
import 'moment/locale/nb';

class BookingHelper {

    //Texts
    public static noSeatsAvailable = "Ingen ledige plasser! igjen";
    public static bookingSavedSuccessfully = "Lagret!";
    public static bookingCancelledSuccessfully = "Avmelding registrert!";
    public static bookingSpecialUsers = "Se hvem som har booket (kun for fellestjenester)!";

  
    public constructor() { }

    public isFridayEvening() : boolean {
        if (moment().isoWeekday() == 5 && moment().isAfter(moment('14:00', 'hh:mm'))) {
            return true;
        }
        return false;
    }

    public createEmptyScheduleWeek(_rawdata: any) {
        var startOfWeek = moment().locale('nb').startOf('isoWeek');
        var endOfWeek = moment().locale('nb').endOf('isoWeek');

        var days = [];
        var day = startOfWeek;

        while (day <= endOfWeek) {
            if (day.isoWeekday() !== 6 && day.isoWeekday() !== 7) {
                days.push(day);
                console.log(day.format('MMMM Do YYYY, h:mm:ss a'))
            }
            day = day.clone().add(1, 'd');
        }

        var thisweek = new ScheduleWeek(days);
    }
}

export default BookingHelper;