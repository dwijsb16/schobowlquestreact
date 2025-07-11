import React, { useEffect, useRef, useState } from "react";
import {
  getCollection,
  getDocumentById,
  updateDocumentFields,
  deleteDocument
} from "../hooks/firestore";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";

// @ts-ignore
declare const gapi: any;

// Credentials
const CLIENT_ID = "430877906839-qfj30rff9auh5u9oaqcrasfbo75m1v1r.apps.googleusercontent.com";
const API_KEY = "AIzaSyCJSOHaAE_EyMED5WgTQ88bZqnGSGFNOdQ";
const CALENDAR_ID = "questsbclub@gmail.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

const EditTournamentForm: React.FC = () => {
  // --- Data State ---
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournId, setSelectedTournId] = useState("");
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success", message: string } | null>(null);

  // Google auth state
  const tokenClient = useRef<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // --- GAPI INIT ---
  useEffect(() => {
    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
        ]
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

  // --- Load tournaments on mount ---
  useEffect(() => {
    async function load() {
      setLoading(true);
      setAlert(null);
      try {
        const data = await getCollection("tournaments");
        setTournaments(data);
      } catch (err) {
        setAlert({ type: "error", message: "Could not load tournaments." });
      }
      setLoading(false);
    }
    load();
  }, []);

  // --- Load selected tournament ---
  async function handleGo() {
    setLoading(true);
    setAlert(null);
    try {
      const tourn = await getDocumentById("tournaments", selectedTournId);
      setFormData(tourn);
    } catch (err) {
      setAlert({ type: "error", message: "Could not load selected tournament." });
    }
    setLoading(false);
  }

  // --- Helper for time conversion ---
  function to24Hour(time12: string) {
    if (!time12) return "";
    if (time12.includes("AM") || time12.includes("PM")) {
      // react-time-picker already returns 24h in "HH:mm" format by default
      // If using 12h format with AM/PM, convert as in your other code
      const [time, modifier] = time12.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    }
    // Already 24h
    return time12.length === 5 ? `${time12}:00` : time12;
  }
  function getTimezoneOffset() {
    const offset = new Date().getTimezoneOffset();
    const sign = offset > 0 ? "-" : "+";
    const pad = (n: number) => String(Math.abs(Math.floor(n))).padStart(2, "0");
    return `${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
  }

  // --- Edit logic ---
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    // 1. Update Firestore
    await updateDocumentFields("tournaments", formData.id, formData);

    // 2. Update Google Calendar (if googleEventId exists)
    const doCalendar = async () => {
      if (formData.googleEventID) {
        const startDateTime = `${formData.date}T${to24Hour(formData.startTime)}${getTimezoneOffset()}`;
        const endDateTime = formData.endTime
          ? `${formData.date}T${to24Hour(formData.endTime)}${getTimezoneOffset()}`
          : startDateTime;
        const description = [
          formData.additionalInfo && `Notes: ${formData.additionalInfo}`,
          formData.rules && `Rules: ${formData.rules}`,
          formData.shirtColor && `Shirt Color: ${formData.shirtColor}`,
          formData.rsvpDate && `RSVP By: ${formData.rsvpDate}${formData.rsvpTime ? ` ${formData.rsvpTime}` : ""}`,
          formData.status && `Status: ${formData.status}`,
          formData.eventType && `Event Type: ${formData.eventType}`,
        ]
          .filter(Boolean)
          .join("\n");

        const gcalObj = {
          summary: formData.eventName,
          location: formData.location,
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
        await gapi.client.calendar.events.update({
          calendarId: CALENDAR_ID,
          eventId: formData.googleEventID,
          resource: gcalObj,
        });
      }
      setAlert({ type: "success", message: "Tournament updated!" });
      setLoading(false);
    };

    // Auth for Google Calendar
    if (!accessToken) {
      tokenClient.current.requestAccessToken();
      tokenClient.current.callback = async (response: any) => {
        setAccessToken(response.access_token);
        gapi.client.setToken({ access_token: response.access_token });
        await doCalendar();
      };
    } else {
      await doCalendar();
    }
  }

  // --- Delete logic ---
  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this tournament? This cannot be undone.")) return;
    setLoading(true);
    setAlert(null);

    // 1. Delete Firestore
    await deleteDocument("tournaments", formData.id);

    // 2. Delete Google Calendar (if googleEventId exists)
    const doCalendarDelete = async () => {
      if (formData.googleEventID) {
        await gapi.client.calendar.events.delete({
          calendarId: CALENDAR_ID,
          eventId: formData.googleEventID,
        });
      }
      setAlert({ type: "success", message: "Tournament deleted." });
      setFormData(null);
      setSelectedTournId("");
      setTournaments(await getCollection("tournaments"));
      setLoading(false);
    };

    if (!accessToken) {
      tokenClient.current.requestAccessToken();
      tokenClient.current.callback = async (response: any) => {
        setAccessToken(response.access_token);
        gapi.client.setToken({ access_token: response.access_token });
        await doCalendarDelete();
      };
    } else {
      await doCalendarDelete();
    }
  }

  // --- Form change handler ---
  function handleChange(field: string, value: any) {
    setFormData({ ...formData, [field]: value });
  }

  // --- Render ---
  return (
    <div className="container d-flex flex-column align-items-center py-5" style={{ minHeight: "90vh" }}>
      <div className="card shadow" style={{
        maxWidth: 650, width: "100%", borderRadius: 24, border: "none", margin: "30px 0"
      }}>
        <div style={{
          background: "linear-gradient(90deg,#43b0f1 0,#ffe17b 120%)",
          borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "28px 28px 16px 28px"
        }}>
          <h2 className="mb-2 text-center" style={{
            color: "#253c60", fontWeight: 800, letterSpacing: "1.2px"
          }}>
            Edit Tournament
          </h2>
        </div>
        <div className="p-4">
          {alert && (
            <div className={`alert alert-${alert.type === "error" ? "danger" : "success"} alert-dismissible fade show`} role="alert">
              {alert.message}
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setAlert(null)}></button>
            </div>
          )}

          {/* Tournament Selector */}
          <div className="form-group mb-4">
            <label htmlFor="tourn_select" className="fw-bold">Choose Tournament to Edit:</label>
            <div className="d-flex gap-2">
              <select
                id="tourn_select"
                className="form-control"
                value={selectedTournId}
                onChange={e => setSelectedTournId(e.target.value)}
                style={{ maxWidth: 350 }}
                disabled={loading}
              >
                <option value="">-- Select --</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.eventName} ({t.date})</option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                disabled={!selectedTournId || loading}
                onClick={handleGo}
                style={{ fontWeight: 700, borderRadius: 18, padding: "7px 32px" }}
              >
                Go
              </button>
            </div>
          </div>

          {/* Only show form if tournament loaded */}
          {formData && (
            <form onSubmit={handleEditSubmit} className="row g-3">
              {/* Tournament Name */}
              <div className="col-12 mb-2">
                <label className="fw-semibold mb-1">Tournament Name:</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={formData.eventName || ""}
                  onChange={e => handleChange("eventName", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {/* Date, Start, End */}
              <div className="col-12 col-md-4 mb-2">
                <label className="fw-semibold mb-1">Date:</label>
                <input
                  type="date"
                  className="form-control rounded-3"
                  value={formData.date || ""}
                  onChange={e => handleChange("date", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="col-6 col-md-4 mb-2">
                <label className="fw-semibold mb-1">Start Time:</label>
                <TimePicker
                  onChange={(val: string | null) => handleChange("startTime", val || "")}
                  value={formData.startTime || ""}
                  disableClock={true}
                  format="HH:mm"
                  className="w-100 custom-timepicker"
                  required
                  clearIcon={null}
                  clockIcon={null}
                  disabled={loading}
                />
              </div>
              <div className="col-6 col-md-4 mb-2">
                <label className="fw-semibold mb-1">End Time:</label>
                <TimePicker
                  onChange={(val: string | null) => handleChange("endTime", val || "")}
                  value={formData.endTime || ""}
                  disableClock={true}
                  format="HH:mm"
                  className="w-100 custom-timepicker"
                  clearIcon={null}
                  clockIcon={null}
                  disabled={loading}
                />
              </div>
              {/* Rules */}
              <div className="col-12 mb-2">
                <label className="fw-semibold mb-1">Rules:</label>
                <textarea
                  className="form-control rounded-3"
                  value={formData.rules || ""}
                  onChange={e => handleChange("rules", e.target.value)}
                  rows={2}
                  placeholder="Enter rules..."
                  disabled={loading}
                />
              </div>
              {/* Location */}
              <div className="col-12 mb-2">
                <label className="fw-semibold mb-1">Tournament Location:</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={formData.location || ""}
                  onChange={e => handleChange("location", e.target.value)}
                  placeholder="Type an address"
                  disabled={loading}
                />
              </div>
              {/* Additional Info */}
              <div className="col-12 mb-2">
                <label className="fw-semibold mb-1">Additional Information:</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={formData.additionalInfo || ""}
                  onChange={e => handleChange("additionalInfo", e.target.value)}
                  placeholder="Type here"
                  disabled={loading}
                />
              </div>
              {/* Buttons */}
              <div className="col-12 d-flex justify-content-between mt-3">
                <button
                  type="button"
                  className="btn btn-danger btn-lg rounded-pill px-5"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg rounded-pill px-5"
                  disabled={loading}
                >
                  Edit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditTournamentForm;
