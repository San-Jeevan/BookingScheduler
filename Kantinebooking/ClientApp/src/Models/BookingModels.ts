import {  } from 'moment';


export enum BookingSlotType {
	Takeaway,
	Slot1,
	Slot2,
	Slot3,
	Slot4
}


//backend klasser
export class AbstractResponse {
	Success: boolean;
	Message: string;
	ErrorLog: string[];
}

export class Bookingday {
	Day: string;
	DayEUFormat: string;
	Slot0: Booking[];
	Slot1: Booking[];
	Slot2: Booking[];
	Slot3: Booking[];
	Slot4: Booking[];
}


export class GetBookingsResponse extends AbstractResponse {
	Monday: Bookingday;
	Tuesday: Bookingday;
	Wednesday: Bookingday;
	Thursday: Bookingday;
	Friday: Bookingday;
}



export class GetTokenResponse extends AbstractResponse {
	Token: string;
	UserName: string;
	Name: string;
}


export class Booking {
	Id: number;
	UserId: string;
	Name: string;
	Timeslot: BookingSlotType;
	BookingDay: Date;
	BookingModified: Date;
}




//front end
export class OnClickBooking {
	Day: string;
	Slot: BookingSlot;
}



//TODO: i bruk??
export class Participant {
	userid: string;
	name: string;
}

export class BookingSlot {
	constructor() {
		this.participants = [] as Participant[];
	}
	participants: Participant[];
	bookedbyme: boolean = false;
}

export class ScheduleDay {
	day: moment.Moment;
	bookingslot0: BookingSlot; //takeaway
	bookingslot1: BookingSlot;
	bookingslot2: BookingSlot;
	bookingslot3: BookingSlot;
	bookingslot4: BookingSlot;
}

export class ScheduleWeek {
	constructor(days: moment.Moment[]) {
		for (let day of days) {
			let dayinnumber = day.isoWeekday();
			let scheduleDay = new ScheduleDay();
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

	monday: ScheduleDay;
	tuesday: ScheduleDay;
	wednesday: ScheduleDay;
	thursday: ScheduleDay;
	friday: ScheduleDay;
}
