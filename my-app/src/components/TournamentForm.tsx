import React, { useEffect, useRef, useState } from "react";
import { gapi } from "gapi-script";
import { addDocument } from "../hooks/firestore";
import { Tournament } from "../types/event";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

const CLIENT_ID = "430877906839-qfj30rff9auh5u9oaqcrasfbo75m1v1r.apps.googleusercontent.com";
const API_KEY = "AIzaSyCJSOHaAE_EyMED5WgTQ88bZqnGSGFNOdQ";
const CALENDAR_ID = "questsbclub@gmail.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

const RED = "#DF2E38";
const DARK_RED = "#B71C1C";
const LIGHT_GREY = "#F7F7F7";
const BLACK = "#232323";
const WHITE = "#fff";

const TournamentForm: React.FC = () => {
  // --- State variables ---
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

  // --- OAuth ---
  const tokenClient = useRef<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // --- Setup GAPI/GIS ---
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

  // --- Helpers ---
  function getTimezoneOffset() {
    const offset = new Date().getTimezoneOffset();
    const sign = offset > 0 ? "-" : "+";
    const pad = (n: number) => String(Math.abs(Math.floor(n))).padStart(2, "0");
    return `${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
  }
  function padTimeWithSeconds(time: string) {
    if (!time) return "";
    if (time.length === 8) return time;
    if (time.length === 5) return time + ":00";
    return time;
  }
  function to24Hour(time: string) {
    if (!time) return "";
    if (/AM|PM/i.test(time)) {
      const [raw, modifier] = time.split(" ");
      let [hours, minutes] = raw.split(":").map(Number);
      if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    }
    return padTimeWithSeconds(time);
  }

  // --- Form reset ---
  const resetForm = () => {
    setEventName(""); setEventType(""); setStatus(""); setDate(""); setStartTime(""); setEndTime("");
    setRsvpDate(""); setRsvpTime(""); setRules(""); setLocation(""); setShirtColor(""); setAdditionalInfo("");
    setAlert(null);
    setLoading(false); // <-- add this!
  };

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

    const insertEvent = async () => {
      try {
        const calendarRes = await gapi.client.calendar.events.insert({
          calendarId: CALENDAR_ID,
          resource: eventObj,
        });
        const googleEventID = calendarRes.result.id;
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
        resetForm();
      } catch (googleErr: any) {
        let googleMessage = "Event could NOT be added to Google Calendar. You can clear and re-submit the form below.";
        if (googleErr?.result?.error?.message) {
          if (googleErr.result.error.message.includes("requiredAccessLevel")) {
            googleMessage = "You don't have edit permission on the club calendar. Ask the owner to grant you access or try a different Google account. (You can clear and retry below.)";
          } else {
            googleMessage = googleErr.result.error.message + " (You can clear and retry below.)";
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
    <div className="container d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(120deg, #fff 50%, ${LIGHT_GREY} 100%)`
      }}>
      <div className="card shadow"
        style={{
          maxWidth: 700,
          width: "100%",
          borderRadius: 24,
          border: "none",
          boxShadow: "0 4px 36px #df2e3810",
          margin: "40px 0",
          background: WHITE
        }}>
        <div
          style={{
            background: `linear-gradient(90deg, ${RED} 0, ${DARK_RED} 100%)`,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: "32px 28px 20px 28px",
            textAlign: "center"
          }}>
          <h2 className="mb-2"
            style={{
              color: WHITE,
              fontWeight: 900,
              letterSpacing: "1.3px",
              fontSize: 32,
              textShadow: "0 1px 12px #B71C1C20"
            }}>
            Add an Event
          </h2>
          <p style={{ color: "#fff", fontSize: 15, opacity: 0.9 }}>
            This form will add an event to both the club calendar and your database.
          </p>
        </div>
        {/* ALERTS */}
        {alert && (
          <div
            className={`alert alert-${alert.type === "error" ? "danger" : "success"} alert-dismissible fade show mx-4 mt-3 mb-0`}
            role="alert"
            style={{
              borderRadius: 12,
              background: alert.type === "error" ? "#FFD6E1" : "#e5fbe9",
              color: alert.type === "error" ? RED : "#219a61",
              border: "none",
              fontWeight: 600
            }}>
            {alert.message}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setAlert(null)} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Event Name */}
          <div className="form-group mb-3">
            <label htmlFor="tourn_name" style={{ fontWeight: 600, color: BLACK }}>
              Event Name<span style={{ color: RED }}> *</span>
            </label>
            <input type="text" id="tourn_name" className="form-control"
              style={{
                borderRadius: 14,
                padding: "10px 16px",
                background: LIGHT_GREY,
                border: `1.5px solid #f3dadf`,
                color: BLACK
              }}
              value={eventName} onChange={e => setEventName(e.target.value)} required disabled={loading}/>
          </div>
          {/* Event Type & Status */}
          <div className="row mb-3">
            <div className="form-group col-md-6">
            <label htmlFor="event_type" style={{ fontWeight: 600, color: "#232323" }}>
  Event Type<span style={{ color: "#DF2E38" }}> *</span>
</label>
<select
  id="event_type"
  name="event_type"
  value={eventType}
  onChange={e => setEventType(e.target.value)}
  required
  style={{
    width: "100%",
    fontSize: 18,
    borderRadius: 14,
    background: "#f7f7f7",
    padding: "12px 18px",
    border: "2px solid #f3dadf",
    color: "#232323",
    marginBottom: 8,
    appearance: "auto",
  }}
>
  <option value="">--- Select an Event Type ---</option>
  <option disabled>——— PRACTICE ——</option>
  <option value="extra_practice">Extra Practice</option>
  <option disabled>——— MATCHES ——</option>
  <option value="match_play">Match Play</option>
  <option disabled>——— TOURNAMENTS ——</option>
  <option value="tournament">Tournament</option>
</select>

              <small style={{ color: "#888", marginTop: 2, display: "block" }}>
                Choose the best-fit category for this event.
              </small>
            </div>
            <div className="form-group col-md-6">
            <label htmlFor="status" style={{ fontWeight: 600, color: "#232323" }}>
  Status<span style={{ color: "#DF2E38" }}> *</span>
</label>
<select
  id="status"
  name="status"
  value={status}
  onChange={e => setStatus(e.target.value)}
  required
  style={{
    width: "100%",
    fontSize: 16,
    borderRadius: 14,
    background: "#f7f7f7",
    padding: "12px 18px",
    border: "2px solid #f3dadf",
    color: "#232323",
    marginBottom: 8,
    appearance: "auto"
  }}
>
  <option value="">--- Select Status ---</option>
  <option value="tentative">Tentative (not confirmed yet)</option>
  <option value="confirmed">Confirmed (official!)</option>
  <option value="cancelled">Cancelled</option>
</select>

              <small style={{ color: "#888", marginTop: 2, display: "block" }}>
                Confirmed means it's finalized and communicated to players.
              </small>
            </div>
          </div>
          {/* Date, Start, End */}
          <div className="row mb-3">
            <div className="form-group col-md-5">
              <label htmlFor="date" style={{ fontWeight: 600, color: BLACK }}>
                Date<span style={{ color: RED }}> *</span>
              </label>
              <input type="date" id="date" className="form-control"
                style={{ borderRadius: 14, background: LIGHT_GREY, border: `1.5px solid #f3dadf`, color: BLACK }}
                value={date} onChange={e => setDate(e.target.value)} required disabled={loading}/>
            </div>
            <div className="form-group col-md-3">
              <label style={{ fontWeight: 600, color: BLACK }}>
                Start Time<span style={{ color: RED }}> *</span>
              </label>
              <input
                type="time"
                className="form-control"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                disabled={loading}
                style={{ borderRadius: 14, background: LIGHT_GREY, border: `1.5px solid #f3dadf`, color: BLACK }}
              />
            </div>
            <div className="form-group col-md-4">
              <label style={{ fontWeight: 600, color: BLACK }}>
                End Time
              </label>
              <input
                type="time"
                className="form-control"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                disabled={loading}
                style={{ borderRadius: 14, background: LIGHT_GREY, border: `1.5px solid #f3dadf`, color: BLACK }}
              />
            </div>
          </div>
          {/* RSVP */}
          <div className="row mb-3">
            <div className="form-group col-md-7">
              <label htmlFor="rsvp_date" style={{ fontWeight: 600, color: BLACK }}>RSVP Date</label>
              <input type="date" id="rsvp_date" className="form-control"
                style={{ borderRadius: 14, background: LIGHT_GREY, border: `1.5px solid #f3dadf`, color: BLACK }}
                value={rsvpDate} onChange={e => setRsvpDate(e.target.value)} disabled={loading}/>
            </div>
            <div className="form-group col-md-5">
              <label htmlFor="rsvp_time" style={{ fontWeight: 600, color: BLACK }}>RSVP Time</label>
              <input type="time" id="rsvp_time" className="form-control"
                style={{ borderRadius: 14, background: LIGHT_GREY, border: `1.5px solid #f3dadf`, color: BLACK }}
                value={rsvpTime} onChange={e => setRsvpTime(e.target.value)} disabled={loading}/>
            </div>
          </div>
          {/* Rules */}
          <div className="form-group mb-3">
            <label htmlFor="rules_tourn" style={{ fontWeight: 600, color: BLACK }}>Rules</label>
            <textarea id="rules_tourn" className="form-control"
              rows={2}
              style={{ borderRadius: 14, background: LIGHT_GREY, border: `1.5px solid #f3dadf`, color: BLACK }}
              value={rules} onChange={e => setRules(e.target.value)} placeholder="Enter rules..." disabled={loading}/>
          </div>
          {/* Location */}
          <div className="form-group mb-3">
            <label htmlFor="location" style={{ fontWeight: 600, color: BLACK }}>Location</label>
            <input type="text" id="location" className="form-control"
              style={{ borderRadius: 14, background: LIGHT_GREY, border: `1.5px solid #f3dadf`, color: BLACK }}
              value={location} onChange={e => setLocation(e.target.value)} placeholder="Enter address" disabled={loading}/>
          </div>
          {/* Shirt Color */}
          <div className="form-group mb-3">
            <label htmlFor="shirt_color" style={{ fontWeight: 600, color: BLACK }}>Shirt Color</label>
            <input type="text" id="shirt_color" className="form-control"
              style={{ borderRadius: 14, background: LIGHT_GREY, border: `1.5px solid #f3dadf`, color: BLACK }}
              value={shirtColor} onChange={e => setShirtColor(e.target.value)} placeholder="e.g., Red/Black" disabled={loading}/>
          </div>
          {/* Additional Info */}
          <div className="form-group mb-3">
            <label htmlFor="additional_info" style={{ fontWeight: 600, color: BLACK }}>Additional Information</label>
            <input type="text" id="additional_info" className="form-control"
              style={{ borderRadius: 14, background: LIGHT_GREY, border: `1.5px solid #f3dadf`, color: BLACK }}
              value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} placeholder="Any notes..." disabled={loading}/>
          </div>
          <div className="text-center pb-3 px-4"
          style={{
            fontSize: 14,
            color: "#888"
          }}>
          <b style={{ color: RED }}>Important:</b> You must be signed in with a Google account <b>with edit access</b> to the shared calendar.<br />
          <span style={{ opacity: 0.8 }}>
            (A Google login popup will appear only if needed!)
          </span>
        </div>
          {/* Buttons Row */}
          <div className="text-center my-4 d-flex justify-content-center gap-3">
            <button
              type="submit"
              className="btn"
              style={{
                background: `linear-gradient(90deg, ${RED}, ${DARK_RED} 100%)`,
                color: WHITE,
                fontWeight: 800,
                padding: "11px 38px",
                fontSize: 19,
                borderRadius: 24,
                border: "none",
                letterSpacing: 1,
                boxShadow: "0 2px 10px #DF2E3830",
                textShadow: "0 1px 4px #B71C1C11"
              }}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={resetForm}
              style={{
                fontWeight: 700,
                padding: "11px 26px",
                fontSize: 17,
                borderRadius: 18,
                marginLeft: 10
              }}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>  
  );
  
};

export default TournamentForm;
