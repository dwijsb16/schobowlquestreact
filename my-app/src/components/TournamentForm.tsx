import React, { useEffect, useRef, useState } from "react";
import { gapi } from "gapi-script";
import { addDocument } from "../hooks/firestore";
import { Tournament } from "../types/event";

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

  // GIS token client
  const tokenClient = useRef<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // GAPI and GIS setup (run once)
  useEffect(() => {
    // Load gapi
    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
        ]
      });
    });

    // Setup Google Identity Services token client
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

  // Helper for timezone offset
  function getTimezoneOffset() {
    const offset = new Date().getTimezoneOffset();
    const sign = offset > 0 ? "-" : "+";
    const pad = (n: number) => String(Math.abs(Math.floor(n))).padStart(2, "0");
    return `${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
  }
  function padTimeWithSeconds(time: string) {
    // If already has seconds, leave alone
    if (time.length === 8) return time;
    // If empty or null, return empty
    if (!time) return "";
    // Otherwise, append :00
    return time + ":00";
  }

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Save tournament to Firestore
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
    };
    await addDocument("tournaments", tournamentData);

    // 2. Prepare Google Calendar event
    const startDateTime = `${date}T${padTimeWithSeconds(startTime)}${getTimezoneOffset()}`;
    const endDateTime = endTime ? `${date}T${padTimeWithSeconds(endTime)}${getTimezoneOffset()}` : startDateTime;
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

    // 3. Add to Calendar (trigger Google login if needed)
    try {
      const insertEvent = async () => {
        const calendarRes = await gapi.client.calendar.events.insert({
          calendarId: CALENDAR_ID,
          resource: eventObj,
        });
        alert("Event created in Firestore and added to shared Google Calendar!");
      };

      if (!accessToken) {
        // User not signed in: trigger OAuth popup
        tokenClient.current.requestAccessToken();
        // Wait for accessToken to be set, then retry event creation (callback)
        tokenClient.current.callback = async (response: any) => {
          setAccessToken(response.access_token);
          gapi.client.setToken({ access_token: response.access_token });
          await insertEvent();
          setLoading(false);
        };
      } else {
        // User is already signed in
        await insertEvent();
        setLoading(false);
      }
    } catch (err) {
      alert("Event saved to Firestore, but could NOT be added to Google Calendar. " + err);
      setLoading(false);
    }
  };

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
            Add a Tournament Event
          </h2>
          <p className="mb-0 text-center" style={{
            color: "#2e3a59", fontSize: 15, opacity: 0.83
          }}>
            This form will add a tournament to both the club calendar and your database.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          {/* Event Name */}
          <div className="form-group mb-3">
            <label htmlFor="tourn_name" style={{ fontWeight: 600 }}>Event Name<span style={{ color: "#ef5350" }}> *</span></label>
            <input type="text" id="tourn_name" className="form-control"
              style={{ borderRadius: 14, padding: "10px 16px" }}
              value={eventName} onChange={e => setEventName(e.target.value)} required />
          </div>
  
          {/* Event Type & Status */}
          <div className="row mb-3">
            <div className="form-group col-md-6">
              <label htmlFor="event_type" style={{ fontWeight: 600 }}>Event Type<span style={{ color: "#ef5350" }}> *</span></label>
              <select id="event_type" className="form-control"
                style={{ borderRadius: 14 }}
                value={eventType} onChange={e => setEventType(e.target.value)} required>
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
                value={status} onChange={e => setStatus(e.target.value)} required>
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
                value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="form-group col-md-3">
              <label htmlFor="start_time" style={{ fontWeight: 600 }}>Start Time<span style={{ color: "#ef5350" }}> *</span></label>
              <input type="time" id="start_time" className="form-control"
                style={{ borderRadius: 14 }}
                value={startTime} onChange={e => setStartTime(e.target.value)} required />
            </div>
            <div className="form-group col-md-4">
              <label htmlFor="end_time" style={{ fontWeight: 600 }}>End Time</label>
              <input type="time" id="end_time" className="form-control"
                style={{ borderRadius: 14 }}
                value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
  
          {/* RSVP */}
          <div className="row mb-3">
            <div className="form-group col-md-7">
              <label htmlFor="rsvp_date" style={{ fontWeight: 600 }}>RSVP Date</label>
              <input type="date" id="rsvp_date" className="form-control"
                style={{ borderRadius: 14 }}
                value={rsvpDate} onChange={e => setRsvpDate(e.target.value)} />
            </div>
            <div className="form-group col-md-5">
              <label htmlFor="rsvp_time" style={{ fontWeight: 600 }}>RSVP Time</label>
              <input type="time" id="rsvp_time" className="form-control"
                style={{ borderRadius: 14 }}
                value={rsvpTime} onChange={e => setRsvpTime(e.target.value)} />
            </div>
          </div>
  
          {/* Rules */}
          <div className="form-group mb-3">
            <label htmlFor="rules_tourn" style={{ fontWeight: 600 }}>Rules</label>
            <textarea id="rules_tourn" className="form-control"
              rows={2}
              style={{ borderRadius: 14 }}
              value={rules} onChange={e => setRules(e.target.value)} placeholder="Enter rules..." />
          </div>
  
          {/* Location */}
          <div className="form-group mb-3">
            <label htmlFor="location" style={{ fontWeight: 600 }}>Location</label>
            <input type="text" id="location" className="form-control"
              style={{ borderRadius: 14 }}
              value={location} onChange={e => setLocation(e.target.value)} placeholder="Enter address" />
          </div>
  
          {/* Shirt Color */}
          <div className="form-group mb-3">
            <label htmlFor="shirt_color" style={{ fontWeight: 600 }}>Shirt Color</label>
            <input type="text" id="shirt_color" className="form-control"
              style={{ borderRadius: 14 }}
              value={shirtColor} onChange={e => setShirtColor(e.target.value)} placeholder="e.g., Red/Black" />
          </div>
  
          {/* Additional Info */}
          <div className="form-group mb-3">
            <label htmlFor="additional_info" style={{ fontWeight: 600 }}>Additional Information</label>
            <input type="text" id="additional_info" className="form-control"
              style={{ borderRadius: 14 }}
              value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} placeholder="Any notes..." />
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
