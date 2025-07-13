import React, { useEffect, useRef, useState } from "react";
import { gapi } from "gapi-script";
import { addDocument } from "../hooks/firestore";
import { Tournament } from "../types/event";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

// Credentials
const CLIENT_ID = "430877906839-qfj30rff9auh5u9oaqcrasfbo75m1v1r.apps.googleusercontent.com";
const API_KEY = "AIzaSyCJSOHaAE_EyMED5WgTQ88bZqnGSGFNOdQ";
const CALENDAR_ID = "questsbclub@gmail.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

const TournamentForm: React.FC = () => {
  // Tournament form state
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rsvpDate, setRsvpDate] = useState("");
  const [rsvpTime, setRsvpTime] = useState("");
  const [rules, setRules] = useState("");
  const [location, setLocation] = useState("");
  const [shirtColor, setShirtColor] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success", message: string } | null>(null);

  // GIS token client and OAuth
  const tokenClient = useRef<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // --- GAPI and GIS setup (run once) ---
  useEffect(() => {
    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
      });
    });
    if (!tokenClient.current && (window as any).google?.accounts?.oauth2) {
      tokenClient.current = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          setAccessToken(response.access_token);
          gapi.client.setToken({ access_token: response.access_token });
        }
      });
    }
  }, []);

  // --- Time helpers ---
  function getTimezoneOffset() {
    const offset = new Date().getTimezoneOffset();
    const sign = offset > 0 ? "-" : "+";
    const pad = (n: number) => String(Math.abs(Math.floor(n))).padStart(2, "0");
    return `${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
  }
  function padTimeWithSeconds(time: string) {
    if (!time) return "";
    if (time.length === 8) return time; // already has seconds
    if (time.length === 5) return time + ":00";
    return time;
  }
  function to24Hour(time: string) {
    if (!time) return "";
    // Accepts "HH:mm", "HH:mm:ss", or "h:mm AM/PM"
    if (/AM|PM/i.test(time)) {
      const [raw, modifier] = time.split(" ");
      let [hours, minutes] = raw.split(":").map(Number);
      if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    }
    return padTimeWithSeconds(time);
  }

  // --- Validation ---
  function validateForm() {
    if (!eventName.trim()) return "Event name is required.";
    if (!eventType) return "Event type is required.";
    if (!status) return "Status is required.";
    if (!date) return "Date is required.";
    if (!startTime) return "Start time is required.";
    if (endTime) {
      const start = new Date(`${date}T${padTimeWithSeconds(startTime)}`);
      const end = new Date(`${date}T${padTimeWithSeconds(endTime)}`);
      if (end <= start) return "End time must be after start time.";
    }
    if (rsvpDate && date) {
      const eventD = new Date(date);
      const rsvpD = new Date(rsvpDate);
      if (rsvpD >= eventD) return "RSVP date must be before event date.";
    }
    return null;
  }

  // --- Submit handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    const validationError = validateForm();
    if (validationError) {
      setAlert({ type: "error", message: validationError });
      return;
    }
    setLoading(true);

    // 1. Prepare Google Calendar event
    const startDateTime = `${date}T${to24Hour(startTime)}${getTimezoneOffset()}`;
    const endDateTime = endTime ? `${date}T${to24Hour(endTime)}${getTimezoneOffset()}` : startDateTime;
    const description = [
      additionalInfo && `Notes: ${additionalInfo}`,
      rules && `Rules: ${rules}`,
      shirtColor && `Shirt Color: ${shirtColor}`,
      rsvpDate && `RSVP By: ${rsvpDate}${rsvpTime ? ` ${rsvpTime}` : ""}`,
      status && `Status: ${status}`,
      eventType && `Event Type: ${eventType}`,
    ].filter(Boolean).join("\n");

    const eventObj = {
      summary: eventName,
      location: location,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: "America/Chicago",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Chicago",
      },
    };

    // 2. Google Calendar logic
    const insertEvent = async () => {
      try {
        const calendarRes = await gapi.client.calendar.events.insert({
          calendarId: CALENDAR_ID,
          resource: eventObj,
        });
        const googleEventID = calendarRes.result.id;

        // 3. Add to Firestore WITH googleEventID
        const tournamentData: Tournament = {
          eventName,
          eventType: eventType as Tournament["eventType"],
          status: status as Tournament["status"],
          date,
          startTime,
          endTime,
          rsvpDate,
          rsvpTime,
          rules,
          location,
          shirtColor,
          additionalInfo,
          googleEventID,
        };
        await addDocument("tournaments", tournamentData);

        setAlert({ type: "success", message: "Event created in Firestore and added to Google Calendar!" });
        // Optionally reset form here:
        setEventName(""); setEventType(""); setStatus(""); setDate(""); setStartTime(""); setEndTime("");
        setRsvpDate(""); setRsvpTime(""); setRules(""); setLocation(""); setShirtColor(""); setAdditionalInfo("");
      } catch (googleErr: any) {
        let googleMessage = "Event could NOT be added to Google Calendar.";
        if (googleErr?.result?.error?.message) {
          if (googleErr.result.error.message.includes("requiredAccessLevel")) {
            googleMessage = "You don't have edit permission on the club calendar. Ask the owner to grant you access or try a different Google account.";
          } else {
            googleMessage = googleErr.result.error.message;
          }
        }
        setAlert({ type: "error", message: googleMessage });
      } finally {
        setLoading(false);
      }
    };

    if (!accessToken) {
      tokenClient.current.requestAccessToken();
      tokenClient.current.callback = async (response: any) => {
        setAccessToken(response.access_token);
        gapi.client.setToken({ access_token: response.access_token });
        await insertEvent();
      };
    } else {
      await insertEvent();
    }
  };

  // --- Render ---
  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "linear-gradient(110deg, #e8f1fa 60%, #fffbe7 100%)" }}>
      <div className="card shadow" style={{
        maxWidth: 700,
        width: "100%",
        borderRadius: 24,
        border: "none",
        boxShadow: "0 4px 36px #b4d3fb60",
        margin: "40px 0"
      }}>
        <div style={{
          background: "linear-gradient(90deg, #43b0f1 0, #ffe17b 120%)",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: "30px 28px 20px 28px"
        }}>
          <h2 className="mb-2 text-center" style={{
            color: "#253c60",
            fontWeight: 800,
            letterSpacing: "1.2px"
          }}>
            Add an Event
          </h2>
          <p className="mb-0 text-center" style={{
            color: "#2e3a59", fontSize: 15, opacity: 0.83
          }}>
            This form will add an event to both the club calendar and your database.
          </p>
        </div>
        {/* ALERTS */}
        {alert && (
          <div className={`alert alert-${alert.type === "error" ? "danger" : "success"} alert-dismissible fade show mx-4 mt-3 mb-0`} role="alert">
            {alert.message}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setAlert(null)}></button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Event Name */}
          <div className="form-group mb-3">
            <label htmlFor="tourn_name" style={{ fontWeight: 600 }}>Event Name<span style={{ color: "#ef5350" }}> *</span></label>
            <input type="text" id="tourn_name" className="form-control"
              style={{ borderRadius: 14, padding: "10px 16px" }}
              value={eventName} onChange={e => setEventName(e.target.value)} required disabled={loading}/>
          </div>
          {/* Event Type & Status */}
          <div className="row mb-3">
            <div className="form-group col-md-6">
              <label htmlFor="event_type" style={{ fontWeight: 600 }}>Event Type<span style={{ color: "#ef5350" }}> *</span></label>
              <select id="event_type" className="form-control"
                style={{ borderRadius: 14 }}
                value={eventType} onChange={e => setEventType(e.target.value)} required disabled={loading}>
                <option value="">Select an event type</option>
                <option value="extra_practice">Extra Practice</option>
                <option value="match_play">Match Play</option>
                <option value="tournament">Tournament</option>
              </select>
            </div>
            <div className="form-group col-md-6">
              <label htmlFor="status" style={{ fontWeight: 600 }}>Status<span style={{ color: "#ef5350" }}> *</span></label>
              <select id="status" className="form-control"
                style={{ borderRadius: 14 }}
                value={status} onChange={e => setStatus(e.target.value)} required disabled={loading}>
                <option value="">Select status</option>
                <option value="tentative">Tentative</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          {/* Date, Start, End */}
          <div className="row mb-3">
            <div className="form-group col-md-5">
              <label htmlFor="date" style={{ fontWeight: 600 }}>Date<span style={{ color: "#ef5350" }}> *</span></label>
              <input type="date" id="date" className="form-control"
                style={{ borderRadius: 14 }}
                value={date} onChange={e => setDate(e.target.value)} required disabled={loading}/>
            </div>
            <div className="form-group col-md-3 d-flex flex-column align-items-start">
              <label style={{ fontWeight: 600 }}>Start Time<span style={{ color: "#ef5350" }}> *</span></label>
              <TimePicker
                onChange={(value: string | null) => setStartTime(value || "")}
                value={startTime}
                disableClock={false}
                clearIcon={null}
                format="hh:mm a"
                amPmAriaLabel="Select AM/PM"
                required
                disabled={loading}
                className="w-100 custom-timepicker"
                clockIcon={<span style={{ fontSize: 20, marginRight: 5 }}>🕒</span>}
              />
            </div>
            <div className="form-group col-md-4 d-flex flex-column align-items-start">
              <label style={{ fontWeight: 600 }}>End Time</label>
              <TimePicker
                onChange={(value: string | null) => setEndTime(value || "")}
                value={endTime}
                disableClock={false}
                clearIcon={null}
                format="hh:mm a"
                amPmAriaLabel="Select AM/PM"
                disabled={loading}
                className="w-100 custom-timepicker"
                clockIcon={<span style={{ fontSize: 20, marginRight: 5 }}>🕒</span>}
              />
            </div>
          </div>
          {/* RSVP */}
          <div className="row mb-3">
            <div className="form-group col-md-7">
              <label htmlFor="rsvp_date" style={{ fontWeight: 600 }}>RSVP Date</label>
              <input type="date" id="rsvp_date" className="form-control"
                style={{ borderRadius: 14 }}
                value={rsvpDate} onChange={e => setRsvpDate(e.target.value)} disabled={loading}/>
            </div>
            <div className="form-group col-md-5">
              <label htmlFor="rsvp_time" style={{ fontWeight: 600 }}>RSVP Time</label>
              <input type="time" id="rsvp_time" className="form-control"
                style={{ borderRadius: 14 }}
                value={rsvpTime} onChange={e => setRsvpTime(e.target.value)} disabled={loading}/>
            </div>
          </div>
          {/* Rules */}
          <div className="form-group mb-3">
            <label htmlFor="rules_tourn" style={{ fontWeight: 600 }}>Rules</label>
            <textarea id="rules_tourn" className="form-control"
              rows={2}
              style={{ borderRadius: 14 }}
              value={rules} onChange={e => setRules(e.target.value)} placeholder="Enter rules..." disabled={loading}/>
          </div>
          {/* Location */}
          <div className="form-group mb-3">
            <label htmlFor="location" style={{ fontWeight: 600 }}>Location</label>
            <input type="text" id="location" className="form-control"
              style={{ borderRadius: 14 }}
              value={location} onChange={e => setLocation(e.target.value)} placeholder="Enter address" disabled={loading}/>
          </div>
          {/* Shirt Color */}
          <div className="form-group mb-3">
            <label htmlFor="shirt_color" style={{ fontWeight: 600 }}>Shirt Color</label>
            <input type="text" id="shirt_color" className="form-control"
              style={{ borderRadius: 14 }}
              value={shirtColor} onChange={e => setShirtColor(e.target.value)} placeholder="e.g., Red/Black" disabled={loading}/>
          </div>
          {/* Additional Info */}
          <div className="form-group mb-3">
            <label htmlFor="additional_info" style={{ fontWeight: 600 }}>Additional Information</label>
            <input type="text" id="additional_info" className="form-control"
              style={{ borderRadius: 14 }}
              value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} placeholder="Any notes..." disabled={loading}/>
          </div>
          {/* Button */}
          <div className="text-center my-4">
            <button type="submit"
              className="btn"
              style={{
                background: "linear-gradient(90deg,#43b0f1,#ffe17b 120%)",
                color: "#232e4a",
                fontWeight: 700,
                padding: "10px 38px",
                fontSize: 18,
                borderRadius: 24,
                border: "none",
                letterSpacing: 1,
                boxShadow: "0 2px 10px #dae3f9a8"
              }}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
        <div className="text-center pb-3 px-4" style={{
          fontSize: 14,
          color: "#546a85"
        }}>
          <b style={{ color: "#ef5350" }}>Important:</b> You must be signed in with a Google account <b>with edit access</b> to the shared calendar.<br />
          <span style={{ opacity: 0.7 }}>
            (A Google login popup will appear only if needed!)
          </span>
        </div>
      </div>
    </div>
  );
};

export default TournamentForm;
