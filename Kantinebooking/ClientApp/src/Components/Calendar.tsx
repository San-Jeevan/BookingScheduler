import React, { useState, useEffect, useReducer } from "react";
import { useHistory } from "react-router-dom";
import moment, { Moment } from 'moment';
import 'moment/locale/nb';
import {  GetBookingsResponse, BookingSlotType, Booking, AbstractResponse, GetTokenResponse, Bookingday } from '../Models/BookingModels'
import { ClientAuthError, InteractionRequiredAuthError, UserAgentApplication, AuthenticationParameters } from 'msal';
import BookingHelper from '../Utils/BookingHelper';
import "../CSS/bootstrap.min.css"
import "../CSS/fontawesome.min.css"
import "../CSS/all.min.css"
import "../CSS/Calendar.css"
import { inherits, isNullOrUndefined } from "util";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const totalavailable = 60;


function Calendar(props: any) {
	const [selectedWeek, setSelectedWeek] = useState<GetBookingsResponse | undefined>(undefined);
	const [showSpinner, setShowSpinner] = useState(false);
	const [showDetailed, setshowDetailed] = useState(false);
	const [myuserid, setmyuserid] = useState("my@hotmail.com");
	const [myname, setmyname] = useState("Jeevan testest");
	const [appToken, setappToken] = useState("");
	const [weekNumber, setweekNumber] = useState<number>(1);
	var _weekNumber = 1;
	const [detailedWeek, setdetailedWeek] = useState<Bookingday | undefined>(undefined);
	var history = useHistory();


	var msalClient: UserAgentApplication;
	const rooturl = process.env.REACT_APP_ROOTURL || window.location.origin;
	const signInOptions = {
		scopes: ["user.read"],
		state: window.location.pathname
	};
	const msalConfig = {
		auth: {
			authority: "https://login.microsoftonline.com/6c351ced-b225-4f28-b822-8cdcd9ba7491",
			clientId: "6f8bbfc9-1cd1-408f-84c6-eafc100505c0", //
			redirectUri: window.location.origin + "/"
		},
		cache: {
			storeAuthStateInCookie: true
		}
	};

	msalClient = new UserAgentApplication(msalConfig);
	msalClient.handleRedirectCallback((err, response) => {
		if (err) {
			alert(err);
		} else {
			var mstoken = localStorage.getItem('msToken');
			if (!isNullOrUndefined(mstoken)) {
				return;
			}
			localStorage.setItem('msToken', response.idToken.rawIdToken);
		}
	});

	useEffect(() => {
		var appToken = localStorage.getItem('kantineToken');
		var mstoken = localStorage.getItem('msToken');
		var name = localStorage.getItem('kantineName');
		var username = localStorage.getItem('kantineUserName');


		if (props.match.params.weekNumber == null) {
			let bookingHelper = new BookingHelper();
			if (bookingHelper.isFridayEvening()) {
				props.match.params.weekNumber = moment().week() + 1;
			}
			else {
				props.match.params.weekNumber = moment().week()
			}
		}

		setweekNumber(parseInt(props.match.params.weekNumber));
		_weekNumber = parseInt(props.match.params.weekNumber);


		if (!isNullOrUndefined(mstoken)) {
			GetToken(mstoken);
			return;
		}

		//TODO: check exp
		if (isNullOrUndefined(appToken) && isNullOrUndefined(mstoken)) {
			newToken();
			return;
		}
		
		if (!isNullOrUndefined(appToken)) {
			setappToken(appToken);
		}

		if (!isNullOrUndefined(name)) {
			setmyname(name);
		}

		if (!isNullOrUndefined(username)) {
			setmyuserid(username);
		}

		GetBookingForWeek(props.match.params.weekNumber);
	}, [])

	function LogOut() {
		localStorage.removeItem('kantineToken');
		localStorage.removeItem('msToken');
		localStorage.removeItem('kantineName');
		localStorage.removeItem('kantineUserName');
		setmyname("");
		setmyuserid("");
		setappToken("");
	}

	function ChangeView(day: Bookingday) {
		setdetailedWeek(day);
		setshowDetailed(!showDetailed);
	}
	
	function ShowError(message: string, duration: number) {
		toast.error(message, {
			position: "top-left",
			autoClose: duration,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
		});
	}
	function ShowSuccess(message: string, duration: number) {
		toast.success(message, {
			position: "top-left",
			autoClose: duration,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
		});
	}

	function newToken() {
		msalClient.loginRedirect(signInOptions);
	}

	function GetBookingForWeek(weekNumber: number) {
		var xhttpreq = new XMLHttpRequest();
		xhttpreq.onreadystatechange = function () {
			setShowSpinner(false);
			if (this.readyState == 4 && this.status == 200) {
				let response = this.response as GetBookingsResponse;
				if (response.Success) {
					setSelectedWeek(response);
					return;
				}
				else {
					ShowError(this.response.Message, 7000);
					return;
				}
			}
			else if (this.readyState == 4 && this.status == 401) {
				let response = this.response as AbstractResponse;
				ShowError(response.Message, 7000);
				return;
			}
		};
		xhttpreq.onerror = function () {
			ShowError("Noe gikk galt, prøv å refresh siden. Til utvikler: API-et er nede", 7000);
			return;
		};
		xhttpreq.responseType = 'json';
		xhttpreq.open("GET", rooturl + '/api/booking/getbookings/?weekNumber=' + weekNumber, true);
		xhttpreq.setRequestHeader("Token", localStorage.getItem('kantineToken'));
		xhttpreq.send(null);
		setShowSpinner(true);
	}

	function UpdateUserInfo(response: GetTokenResponse) {
		localStorage.setItem('kantineToken', response.Token);
		localStorage.setItem('kantineName', response.Name);
		localStorage.setItem('kantineUserName', response.UserName);
		localStorage.removeItem('msToken');
		setmyname(response.Name);
		setmyuserid(response.UserName);
		setappToken(response.Token);
	}

	function GetToken(token: string) {
		var payload = {
			"MSToken": token
		}
		var xhttpreq = new XMLHttpRequest();
		xhttpreq.onreadystatechange = function () {
			setShowSpinner(false);
			if (this.readyState == 4 && this.status == 200) {
				let response = this.response as GetTokenResponse;
				if (response.Success) {
					ShowSuccess(`Logget inn som ${response.Name}`, 5000);
					UpdateUserInfo(response);
					GetBookingForWeek(_weekNumber);
				}
				else {
					ShowError(response.Message, 7000);
				}
			}
		};
		xhttpreq.open("POST", rooturl + '/api/booking/GetToken', true);
		xhttpreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhttpreq.responseType = "json";
		xhttpreq.send(JSON.stringify(payload));
		setShowSpinner(true);
	}

	function CreateBooking(slotType: BookingSlotType, day: Moment) {
		var payload = {
			"UserId": myuserid,
			"Name": myname,
			"Timeslot": slotType,
			"BookingDay": day.format()
		}
		var xhttpreq = new XMLHttpRequest();
		xhttpreq.onreadystatechange = function () {
			setShowSpinner(false);
			if (this.readyState == 4 && this.status == 200) {
				let response = this.response as AbstractResponse;
				if (response.Success) {
					ShowSuccess(BookingHelper.bookingSavedSuccessfully, 2000);
					GetBookingForWeek(weekNumber);
					return;
				}
				else {
					ShowError(response.Message, 7000);
					return;
				}
			}
			else if (this.readyState == 4 && this.status == 401) {
				let response = this.response as AbstractResponse;
				ShowError(response.Message, 7000);
				return;
			}
		};
		xhttpreq.open("POST", rooturl + '/api/booking/book', true);
		xhttpreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhttpreq.setRequestHeader("Token", appToken);
		xhttpreq.responseType = "json";
		xhttpreq.send(JSON.stringify(payload));
		setShowSpinner(true);
	}

	function CancelBooking(slotType: BookingSlotType, day: Moment) {
		var payload = {
			"UserId": myuserid,
			"Name": myname,
			"Timeslot": slotType,
			"BookingDay": day.format()
		}
		var xhttpreq = new XMLHttpRequest();
		xhttpreq.onreadystatechange = function () {
			setShowSpinner(false);
			if (this.readyState == 4 && this.status == 200) {
				let response = this.response as AbstractResponse;
				if (response.Success) {
					ShowSuccess(BookingHelper.bookingCancelledSuccessfully, 5000);
					GetBookingForWeek(weekNumber);
					return;
				}
				else {
					ShowError(response.Message, 7000);
					return;
				}
			}
			else if (this.readyState == 4 && this.status == 401) {
				let response = this.response as AbstractResponse;
				ShowError(response.Message, 7000);
				return;
			}
		};
		xhttpreq.open("POST", rooturl + '/api/booking/cancel', true);
		xhttpreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhttpreq.setRequestHeader("Token", appToken);
		xhttpreq.responseType = "json";
		xhttpreq.send(JSON.stringify(payload));
		setShowSpinner(true);
	}

	async function slotSelected(e) {
		e.persist();
		var slot = "";
		var day = moment();
		if (e.target.nodeName == "SPAN") {
			slot = e.target.offsetParent.dataset.slot as string;
			day = moment(e.target.offsetParent.dataset.day, "DD.MM.YYYY");
		}
		else {
			slot = e.target.dataset.slot as string;
			day = moment(e.target.dataset.day, "DD.MM.YYYY");
		}

		let bookinglist = selectedWeek[day.locale("en").format("dddd")][slot] as Booking[];

		if (bookinglist.find(e => e.UserId === myuserid) !== undefined) {
			CancelBooking(BookingSlotType[slot], day);
			return;
		}
		else if (bookinglist.length >= totalavailable && slot !== "Slot0") {
			toast.error(BookingHelper.noSeatsAvailable, {
				position: "top-left",
				autoClose: 7000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
			});
			return;
		}
		CreateBooking(BookingSlotType[slot], day);
	}

	function ChangeWeek(back: boolean) {
		if (back) {
			GetBookingForWeek(weekNumber - 1)
			setweekNumber(weekNumber - 1);
		}
		else {
			GetBookingForWeek(weekNumber + 1)
			setweekNumber(weekNumber + 1);
		}
	}

	document.title = "booking";

	return (
		<div className="container-fluid">
			<div className="row">
				<div className="col-12">
					<div className="d-flex flex-row-reverse">
						<div className="p-2"><span className="text-right">{myname}</span>
							{myname == "" && <span style={{ cursor: "pointer" }} onClick={() => newToken()}> [Logg inn]</span>}
							{myname !== "" && <span style={{ cursor: "pointer" }} onClick={LogOut}> [Logg ut]</span>}
						</div>
					</div>
				</div>
			</div>

			{showDetailed && <div>
				<h1 style={{ cursor: "pointer" }} onClick={() => ChangeView(undefined)}><i className="fas fa-chevron-left"></i> TILBAKE</h1>
				<div className="row">
					<div className="col-2">
						<h4>Viser: {detailedWeek.DayEUFormat}</h4>
					</div>
				</div>
				<div className="row justify-content-center">
					<div className="col-2">
						<h1>TOTALT: {detailedWeek.Slot0.length + detailedWeek.Slot1.length + detailedWeek.Slot2.length + detailedWeek.Slot3.length + detailedWeek.Slot4.length}</h1>
					</div>
				</div>

				<div className="mt-5 row justify-content-center">
					<div className="col-2">
						<h3 className='mt-2'>Takeaway ({detailedWeek.Slot0.length}):</h3>
						<div>{detailedWeek.Slot0.map(i => <div>{i.Name || "bare synlig for fellestjenester"}</div>)}</div>
					</div>
					<div className="col-2">
						<h3 className='mt-2'>10:30-11:00 ({detailedWeek.Slot1.length})</h3>
						<div>{detailedWeek.Slot1.map(i => <div>{i.Name || "bare synlig for fellestjenester"}</div>)}</div>
					</div>
					<div className="col-2">
						<h3 className='mt-2'>11:00-11:30 ({detailedWeek.Slot2.length})</h3>
						<div>{detailedWeek.Slot2.map(i => <div>{i.Name || "bare synlig for fellestjenester"}</div>)}</div>
					</div>
					<div className="col-2">
						<h3 className='mt-2'>11:30-12:00 ({detailedWeek.Slot3.length})</h3>
						<div>{detailedWeek.Slot3.map(i => <div>{i.Name || "bare synlig for fellestjenester"}</div>)}</div>
					</div>
					<div className="col-2">
						<h3 className='mt-2'>12:00-12:30 ({detailedWeek.Slot4.length})</h3>
						<div>{detailedWeek.Slot4.map(i => <div>{i.Name || "bare synlig for fellestjenester"}</div>)}</div>
					</div>
				</div>
				
			</div>}
			{!showDetailed && 
			<div className="row justify-content-center">
				<div className="col-xl-9 col-lg-12 col-md-12 col-sm-12">
					<h1>Slik fungerer bookingsystemet: </h1>
					<div>
						<div>1. Velg hvilken uke du skal reservere lunsj for ved å trykke på pilens retning  </div>
						<div>2. Tidsrommene har 30min intervaller: finn et tidsrom for ønsket dag som er ledig og trykk på den. Når valget er gjort vil rutens farge endres til blått.   </div>
						<div>3. Det kan kun gjøres et valg per dag. Har man valgt feil tidsrom eller ønsker takeaway, kan man trykke på annet tidsrom/ takeaway.   </div>
						<div>4. Skal lunsjen avbestilles gjøres dette ved å trykke på samme rute som man har bestilt. Når ruten endres til grå er lunsjen avbestilt.   </div>
					</div>
                    	<div className="card booking-schedule schedule-widget mt-5">
						<div className="text-center mt-3">
							<h1><i style={{ cursor: "pointer" }} onClick={() => ChangeWeek(true)} className="fas fa-chevron-left"></i> UKE {weekNumber} <i style={{ cursor: "pointer" }} onClick={() => ChangeWeek(false)} className="fas fa-chevron-right"></i></h1>
						</div>
						<div className="schedule-header">
							<div className="row">
								<div className="col-12">
									<div className="day-slot">
										<ul>
											<li>
												<span>MAN</span>
												<span className="slot-date">{selectedWeek?.Monday.Day} <i onClick={() => ChangeView(selectedWeek?.Monday)} title={BookingHelper.bookingSpecialUsers} style={{ cursor: "pointer" }} className="far fa-eye"></i></span> 
											</li>
											<li>
												<span>TIR</span>
												<span className="slot-date">{selectedWeek?.Tuesday.Day} <i onClick={() => ChangeView(selectedWeek?.Tuesday)} title={BookingHelper.bookingSpecialUsers} style={{ cursor: "pointer" }} className="far fa-eye"></i></span>
											</li>
											<li>
												<span>ONS</span>
												<span className="slot-date ">{selectedWeek?.Wednesday.Day} <i onClick={() => ChangeView(selectedWeek?.Wednesday)} title={BookingHelper.bookingSpecialUsers} style={{ cursor: "pointer" }} className="far fa-eye"></i></span>
											</li>
											<li>
												<span>TOR</span>
												<span className="slot-date">{selectedWeek?.Thursday.Day} <i onClick={() => ChangeView(selectedWeek?.Thursday)} title={BookingHelper.bookingSpecialUsers} style={{ cursor: "pointer" }} className="far fa-eye"></i></span>
											</li>
											<li>
												<span>FRE </span>
												<span className="slot-date">{selectedWeek?.Friday.Day} <i onClick={() => ChangeView(selectedWeek?.Friday)} title={BookingHelper.bookingSpecialUsers} style={{ cursor: "pointer" }} className="far fa-eye"></i> </span> 
											</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
						<div className="schedule-cont mb-5">
							<div className="row">
								<div className="col-12">
									<div className="time-slot">
										<ul className="clearfix">
											<li>
												<a data-slot={"Slot0"} data-day={selectedWeek?.Monday.DayEUFormat} title={selectedWeek?.Monday.Slot0.length + " har bestilt takeaway"}  className={"timing " + (selectedWeek?.Monday.Slot0.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>Takeaway</span> <span className="availableSlots">{selectedWeek?.Monday.Slot0.length}</span>
												</a>
												<a data-slot={"Slot1"} data-day={selectedWeek?.Monday.DayEUFormat} className={"timing " + (selectedWeek?.Monday.Slot1.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>10:30-11:00</span> <span className="availableSlots">{selectedWeek?.Monday.Slot1.length}</span>
												</a>
												<a data-slot={"Slot2"} data-day={selectedWeek?.Monday.DayEUFormat} className={"timing " + (selectedWeek?.Monday.Slot2.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>11:00-11:30</span> <span className="availableSlots">{selectedWeek?.Monday.Slot2.length}</span>
												</a>
												<a data-slot={"Slot3"} data-day={selectedWeek?.Monday.DayEUFormat} className={"timing " + (selectedWeek?.Monday.Slot3.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>11:30-12:00</span> <span className="availableSlots">{selectedWeek?.Monday.Slot3.length}</span>
												</a>
												<a data-slot={"Slot4"} data-day={selectedWeek?.Monday.DayEUFormat} className={"timing " + (selectedWeek?.Monday.Slot4.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>12:00-12:30</span>  <span className="availableSlots">{selectedWeek?.Monday.Slot4.length}</span>
												</a>
											</li>
											<li>
												<a data-slot={"Slot0"} data-day={selectedWeek?.Tuesday.DayEUFormat} title={selectedWeek?.Tuesday.Slot0.length + " har bestilt takeaway"} className={"timing " + (selectedWeek?.Tuesday.Slot0.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>Takeaway</span> <span className="availableSlots">{selectedWeek?.Tuesday.Slot0.length}</span>
												</a>
												<a data-slot={"Slot1"} data-day={selectedWeek?.Tuesday.DayEUFormat} className={"timing " + (selectedWeek?.Tuesday.Slot1.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>10:30-11:00</span> <span className="availableSlots">{selectedWeek?.Tuesday.Slot1.length}</span>
												</a>
												<a data-slot={"Slot2"} data-day={selectedWeek?.Tuesday.DayEUFormat} className={"timing " + (selectedWeek?.Tuesday.Slot2.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>11:00-11:30</span> <span className="availableSlots">{selectedWeek?.Tuesday.Slot2.length}</span>
												</a>
												<a data-slot={"Slot3"} data-day={selectedWeek?.Tuesday.DayEUFormat} className={"timing " + (selectedWeek?.Tuesday.Slot3.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>11:30-12:00</span> <span className="availableSlots">{selectedWeek?.Tuesday.Slot3.length}</span>
												</a>
												<a data-slot={"Slot4"} data-day={selectedWeek?.Tuesday.DayEUFormat} className={"timing " + (selectedWeek?.Tuesday.Slot4.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>12:00-12:30</span>  <span className="availableSlots">{selectedWeek?.Tuesday.Slot4.length}</span>
												</a>
											</li>
											<li>
												<a data-slot={"Slot0"} data-day={selectedWeek?.Wednesday.DayEUFormat} title={selectedWeek?.Wednesday.Slot0.length + " har bestilt takeaway"} className={"timing " + (selectedWeek?.Wednesday.Slot0.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>Takeaway</span> <span className="availableSlots">{selectedWeek?.Wednesday.Slot0.length}</span>
												</a>
												<a data-slot={"Slot1"} data-day={selectedWeek?.Wednesday.DayEUFormat} className={"timing " + (selectedWeek?.Wednesday.Slot1.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>10:30-11:00</span> <span className="availableSlots">{selectedWeek?.Wednesday.Slot1.length}</span>
												</a>
												<a data-slot={"Slot2"} data-day={selectedWeek?.Wednesday.DayEUFormat} className={"timing " + (selectedWeek?.Wednesday.Slot2.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>11:00-11:30</span> <span className="availableSlots">{selectedWeek?.Wednesday.Slot2.length}</span>
												</a>
												<a data-slot={"Slot3"} data-day={selectedWeek?.Wednesday.DayEUFormat} className={"timing " + (selectedWeek?.Wednesday.Slot3.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>11:30-12:00</span> <span className="availableSlots">{selectedWeek?.Wednesday.Slot3.length}</span>
												</a>
												<a data-slot={"Slot4"} data-day={selectedWeek?.Wednesday.DayEUFormat} className={"timing " + (selectedWeek?.Wednesday.Slot4.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>12:00-12:30</span>  <span className="availableSlots">{selectedWeek?.Wednesday.Slot4.length}</span>
												</a>
											</li>
											<li>
												<a data-slot={"Slot0"} data-day={selectedWeek?.Thursday.DayEUFormat} title={selectedWeek?.Thursday.Slot0.length + " har bestilt takeaway"} className={"timing " + (selectedWeek?.Thursday.Slot0.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>Takeaway</span> <span className="availableSlots">{selectedWeek?.Thursday.Slot0.length}</span>
												</a>
												<a data-slot={"Slot1"} data-day={selectedWeek?.Thursday.DayEUFormat} className={"timing " + (selectedWeek?.Thursday.Slot1.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>10:30-11:00</span> <span className="availableSlots">{selectedWeek?.Thursday.Slot1.length}</span>
												</a>
												<a data-slot={"Slot2"} data-day={selectedWeek?.Thursday.DayEUFormat} className={"timing " + (selectedWeek?.Thursday.Slot2.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>11:00-11:30</span> <span className="availableSlots">{selectedWeek?.Thursday.Slot2.length}</span>
												</a>
												<a data-slot={"Slot3"} data-day={selectedWeek?.Thursday.DayEUFormat} className={"timing " + (selectedWeek?.Thursday.Slot3.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>11:30-12:00</span> <span className="availableSlots">{selectedWeek?.Thursday.Slot3.length}</span>
												</a>
												<a data-slot={"Slot4"} data-day={selectedWeek?.Thursday.DayEUFormat} className={"timing " + (selectedWeek?.Thursday.Slot4.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>12:00-12:30</span>  <span className="availableSlots">{selectedWeek?.Thursday.Slot4.length}</span>
												</a>
											</li>
											<li>
												<a data-slot={"Slot0"} data-day={selectedWeek?.Friday.DayEUFormat} title={selectedWeek?.Friday.Slot0.length + " har bestilt takeaway"} className={"timing " + (selectedWeek?.Friday.Slot0.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>Takeaway</span> <span className="availableSlots">{selectedWeek?.Friday.Slot0.length}</span>
												</a>
												<a data-slot={"Slot1"} data-day={selectedWeek?.Friday.DayEUFormat} className={"timing " + (selectedWeek?.Friday.Slot1.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>10:30-11:00</span> <span className="availableSlots">{selectedWeek?.Friday.Slot1.length}</span>
												</a>
												<a data-slot={"Slot2"} data-day={selectedWeek?.Friday.DayEUFormat} className={"timing " + (selectedWeek?.Friday.Slot2.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>11:00-11:30</span> <span className="availableSlots">{selectedWeek?.Friday.Slot2.length}</span>
												</a>
												<a data-slot={"Slot3"} data-day={selectedWeek?.Friday.DayEUFormat} className={"timing " + (selectedWeek?.Friday.Slot3.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>11:30-12:00</span> <span className="availableSlots">{selectedWeek?.Friday.Slot3.length}</span>
												</a>
												<a data-slot={"Slot4"} data-day={selectedWeek?.Friday.DayEUFormat} className={"timing " + (selectedWeek?.Friday.Slot4.find(e => e.UserId === myuserid) ? 'selected' : '')} onClick={slotSelected}>
													<span>12:00-12:30</span>  <span className="availableSlots">{selectedWeek?.Friday.Slot4.length}</span>
												</a>
											</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</div>
					{showSpinner && <div className="text-center">
						<div className="spinner-border mt-2" role="status">
							<span className="sr-only">Loading...</span>
						</div>
					</div>}
				</div>
				</div>}
			<ToastContainer />
		</div>
    );

}

export default Calendar;