import React, { useEffect, useRef, useState } from "react";
import {
  getCollection,
  getDocumentById,
  updateDocumentFields,
  deleteDocument,
} from "../hooks/firestore";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
// @ts-ignore
import { gapi } from "gapi-script";

const CLIENT_ID = "430877906839-qfj30rff9auh5u9oaqcrasfbo75m1v1r.apps.googleusercontent.com";
const API_KEY = "AIzaSyCJSOHaAE_EyMED5WgTQ88bZqnGSGFNOdQ";
const CALENDAR_ID = "questsbclub@gmail.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

const EditTournamentForm: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournId, setSelectedTournId] = useState("");
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // Google OAuth
  const tokenClient = useRef<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // --- Google API Setup ---
  useEffect(() => {
    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        ],
      });
    });
    // @ts-ignore
    if (window.google && window.google.accounts) {
      // @ts-ignore
      tokenClient.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          setAccessToken(response.access_token);
          gapi.client.setToken({ access_token: response.access_token });
        },
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
      } catch {
        setAlert({ type: "error", message: "Could not load tournaments." });
      }
      setLoading(false);
    }
    load();
  }, []);

  // --- Fetch selected tournament ---
  async function handleGo() {
    setLoading(true);
    setAlert(null);
    try {
      const tourn = await getDocumentById("tournaments", selectedTournId);
      setFormData(tourn);
    } catch {
      setAlert({ type: "error", message: "Could not load selected tournament." });
    }
    setLoading(false);
  }

  // --- Field change handler ---
  function handleChange(field: string, value: any) {
    setFormData({ ...formData, [field]: value });
  }

  // --- Helpers ---
  function getTimezoneOffset() {
    const offset = new Date().getTimezoneOffset();
    const abs = Math.abs(offset);
    const sign = offset > 0 ? "-" : "+";
    return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
  }
  function padTimeWithSeconds(time: string) {
    if (!time) return "";
    if (time.length === 8) return time;
    if (time.length === 5) return time + ":00";
    return time;
  }
  function to24Hour(time: string) {
    if (!time) return "";
    if (time.match(/AM|PM/i)) {
      const [raw, modifier] = time.split(" ");
      let [hours, minutes] = raw.split(":").map(Number);
      if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    }
    return padTimeWithSeconds(time);
  }

  // --- Google Calendar wrapper ---
  async function doCalendarAction(cb: () => Promise<any>) {
    if (accessToken) return cb();
    return new Promise((resolve, reject) => {
      tokenClient.current.requestAccessToken();
      tokenClient.current.callback = async (response: any) => {
        setAccessToken(response.access_token);
        gapi.client.setToken({ access_token: response.access_token });
        try {
          await cb();
          resolve(null);
        } catch (err) {
          reject(err);
        }
      };
    });
  }

  // --- Edit logic ---
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      // Time to 24hr format
      const startTime = to24Hour(formData.startTime);
      const endTime = to24Hour(formData.endTime);

      // Update Firestore
      await updateDocumentFields("tournaments", formData.id, {
        ...formData,
        startTime,
        endTime: formData.endTime ? endTime : "",
      });

      if (!formData.googleEventID) {
        setAlert({ type: "error", message: "No Google Calendar ID; event updated only in Firestore." });
        setLoading(false);
        return;
      }
      // Google Calendar update
      const startDateTime = `${formData.date}T${startTime}${getTimezoneOffset()}`;
      const endDateTime = formData.endTime
        ? `${formData.date}T${endTime}${getTimezoneOffset()}`
        : startDateTime;
      const description = [
        formData.additionalInfo && `Notes: ${formData.additionalInfo}`,
        formData.rules && `Rules: ${formData.rules}`,
        formData.shirtColor && `Shirt Color: ${formData.shirtColor}`,
        formData.rsvpDate && `RSVP By: ${formData.rsvpDate}${formData.rsvpTime ? ` ${formData.rsvpTime}` : ""}`,
        formData.status && `Status: ${formData.status}`,
        formData.eventType && `Event Type: ${formData.eventType}`,
      ].filter(Boolean).join("\n");

      const eventObj = {
        summary: formData.eventName,
        location: formData.location,
        description,
        start: {
          dateTime: startDateTime,
          timeZone: "America/Chicago",
        },
        end: {
          dateTime: endDateTime,
          timeZone: "America/Chicago",
        },
      };

      await doCalendarAction(() =>
        gapi.client.calendar.events.update({
          calendarId: CALENDAR_ID,
          eventId: formData.googleEventID,
          resource: eventObj,
        })
      );
      setAlert({ type: "success", message: "Tournament updated (Firestore + Google Calendar)!" });
    } catch {
      setAlert({ type: "error", message: "Failed to update tournament. (Is your Google login valid?)" });
    }
    setLoading(false);
  }

  // --- Delete logic ---
  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this tournament? This cannot be undone.")) return;
    setLoading(true);
    setAlert(null);
    try {
      await deleteDocument("tournaments", formData.id);
      if (formData.googleEventID) {
        await doCalendarAction(() =>
          gapi.client.calendar.events.delete({
            calendarId: CALENDAR_ID,
            eventId: formData.googleEventID,
          })
        );
      }
      setAlert({ type: "success", message: "Tournament deleted (Firestore + Google Calendar)." });
      setFormData(null);
      setSelectedTournId("");
      setTournaments(await getCollection("tournaments"));
    } catch {
      setAlert({ type: "error", message: "Failed to delete tournament." });
    }
    setLoading(false);
  }

  // --- Render ---
  return (
    <div className="container d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #fff 60%, #F7F7F7 100%)"
      }}>
      <div className="card shadow"
        style={{
          maxWidth: 700,
          width: "100%",
          borderRadius: 24,
          border: "none",
          boxShadow: "0 4px 36px #df2e3810",
          margin: "40px 0",
          background: "#fff"
        }}>
        <div style={{
          background: "linear-gradient(90deg, #DF2E38 0, #B71C1C 100%)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "32px 28px 20px 28px",
          textAlign: "center"
        }}>
          <h2 className="mb-2"
            style={{
              color: "#fff",
              fontWeight: 900,
              letterSpacing: "1.2px",
              fontSize: 32,
              textShadow: "0 1px 10px #B71C1C30"
            }}>
            Edit or Delete Event
          </h2>
          <p style={{ color: "#fff", fontSize: 15, opacity: 0.9 }}>
            Update an event in the club calendar and database.
          </p>
        </div>
  
        <div className="p-4">
          {alert && (
            <div
              className={`alert alert-${alert.type === "error" ? "danger" : "success"} alert-dismissible fade show mx-1 mb-3`}
              role="alert"
              style={{
                borderRadius: 12,
                background: alert.type === "error" ? "#FFD6E1" : "#e5fbe9",
                color: alert.type === "error" ? "#DF2E38" : "#219a61",
                border: "none",
                fontWeight: 600
              }}>
              {alert.message}
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setAlert(null)} />
            </div>
          )}
  
          {/* Tournament Selection */}
          <div className="d-flex flex-wrap align-items-end gap-2 mb-4">
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="fw-semibold" style={{ fontWeight: 600, color: "#DF2E38" }}>Select Event:</label>
              <select
                className="form-select"
                value={selectedTournId}
                onChange={e => setSelectedTournId(e.target.value)}
                disabled={loading}
                style={{
                  borderRadius: 14,
                  background: "#F7F7F7",
                  border: "1.5px solid #f3dadf",
                  color: "#232323"
                }}
              >
                <option value="">-- Choose an event --</option>
                {tournaments.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.eventName} ({t.date})
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn"
              style={{
                minWidth: 80,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 17,
                background: "linear-gradient(90deg,#DF2E38 0,#B71C1C 100%)",
                color: "#fff",
                boxShadow: "0 2px 8px #DF2E3820",
                border: "none"
              }}
              onClick={handleGo}
              disabled={loading || !selectedTournId}
            >
              Go
            </button>
          </div>
  
          {/* Only show form if tournament loaded */}
          {formData && (
            <form onSubmit={handleEditSubmit} className="row g-3">
              {/* Event Name */}
              <div className="col-12 mb-2">
                <label className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>Event Name:</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={formData.eventName || ""}
                  onChange={e => handleChange("eventName", e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    borderRadius: 14,
                    background: "#F7F7F7",
                    border: "1.5px solid #f3dadf",
                    color: "#232323"
                  }}
                />
              </div>
              {/* Event Type & Status */}
              <div className="row mb-2">
                <div className="form-group col-md-6">
                  <label htmlFor="event_type" className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>Event Type:</label>
                  <select
                    id="event_type"
                    className="form-control"
                    value={formData.eventType || ""}
                    onChange={e => handleChange("eventType", e.target.value)}
                    required
                    disabled={loading}
                    style={{
                      borderRadius: 14,
                      background: "#F7F7F7",
                      border: "1.5px solid #f3dadf",
                      color: "#232323"
                    }}
                  >
                    <option value="">Select an event type</option>
                    <option value="extra_practice">Extra Practice</option>
                    <option value="match_play">Match Play</option>
                    <option value="tournament">Tournament</option>
                  </select>
                </div>
                <div className="form-group col-md-6">
                  <label htmlFor="status" className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>Status:</label>
                  <select
                    id="status"
                    className="form-control"
                    value={formData.status || ""}
                    onChange={e => handleChange("status", e.target.value)}
                    required
                    disabled={loading}
                    style={{
                      borderRadius: 14,
                      background: "#F7F7F7",
                      border: "1.5px solid #f3dadf",
                      color: "#232323"
                    }}
                  >
                    <option value="">Select status</option>
                    <option value="tentative">Tentative</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              {/* Date, Start, End */}
              <div className="row mb-2">
                <div className="form-group col-md-5">
                  <label className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>Date:</label>
                  <input
                    type="date"
                    className="form-control rounded-3"
                    value={formData.date || ""}
                    onChange={e => handleChange("date", e.target.value)}
                    required
                    disabled={loading}
                    style={{
                      borderRadius: 14,
                      background: "#F7F7F7",
                      border: "1.5px solid #f3dadf",
                      color: "#232323"
                    }}
                  />
                </div>
                <div className="form-group col-md-3 d-flex flex-column align-items-start">
                  <label className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>Start Time:</label>
                  <TimePicker
                    onChange={(value: string | null) => handleChange("startTime", value || "")}
                    value={formData.startTime || ""}
                    disableClock={false}
                    clearIcon={null}
                    format="hh:mm a"
                    amPmAriaLabel="Select AM/PM"
                    required
                    disabled={loading}
                    className="w-100 custom-timepicker"
                    clockIcon={<span style={{ fontSize: 20, marginRight: 5, color: "#DF2E38" }}>🕒</span>}
                  />
                </div>
                <div className="form-group col-md-4 d-flex flex-column align-items-start">
                  <label className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>End Time:</label>
                  <TimePicker
                    onChange={(value: string | null) => handleChange("endTime", value || "")}
                    value={formData.endTime || ""}
                    disableClock={false}
                    clearIcon={null}
                    format="hh:mm a"
                    amPmAriaLabel="Select AM/PM"
                    disabled={loading}
                    className="w-100 custom-timepicker"
                    clockIcon={<span style={{ fontSize: 20, marginRight: 5, color: "#DF2E38" }}>🕒</span>}
                  />
                </div>
              </div>
              {/* RSVP */}
              <div className="row mb-2">
                <div className="form-group col-md-7">
                  <label className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>RSVP Date:</label>
                  <input
                    type="date"
                    className="form-control rounded-3"
                    value={formData.rsvpDate || ""}
                    onChange={e => handleChange("rsvpDate", e.target.value)}
                    disabled={loading}
                    style={{
                      borderRadius: 14,
                      background: "#F7F7F7",
                      border: "1.5px solid #f3dadf",
                      color: "#232323"
                    }}
                  />
                </div>
                <div className="form-group col-md-5">
                  <label className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>RSVP Time:</label>
                  <input
                    type="time"
                    className="form-control rounded-3"
                    value={formData.rsvpTime || ""}
                    onChange={e => handleChange("rsvpTime", e.target.value)}
                    disabled={loading}
                    style={{
                      borderRadius: 14,
                      background: "#F7F7F7",
                      border: "1.5px solid #f3dadf",
                      color: "#232323"
                    }}
                  />
                </div>
              </div>
              {/* Rules */}
              <div className="col-12 mb-2">
                <label className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>Rules:</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={formData.rules || ""}
                  onChange={e => handleChange("rules", e.target.value)}
                  disabled={loading}
                  style={{
                    borderRadius: 14,
                    background: "#F7F7F7",
                    border: "1.5px solid #f3dadf",
                    color: "#232323"
                  }}
                />
              </div>
              {/* Location */}
              <div className="col-12 mb-2">
                <label className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>Location:</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={formData.location || ""}
                  onChange={e => handleChange("location", e.target.value)}
                  placeholder="Enter address"
                  disabled={loading}
                  style={{
                    borderRadius: 14,
                    background: "#F7F7F7",
                    border: "1.5px solid #f3dadf",
                    color: "#232323"
                  }}
                />
              </div>
              {/* Shirt Color */}
              <div className="col-12 mb-2">
                <label className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>Shirt Color:</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={formData.shirtColor || ""}
                  onChange={e => handleChange("shirtColor", e.target.value)}
                  placeholder="e.g., Red/Black"
                  disabled={loading}
                  style={{
                    borderRadius: 14,
                    background: "#F7F7F7",
                    border: "1.5px solid #f3dadf",
                    color: "#232323"
                  }}
                />
              </div>
              {/* Additional Info */}
              <div className="col-12 mb-2">
                <label className="fw-semibold mb-1" style={{ fontWeight: 600, color: "#232323" }}>Additional Info:</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  value={formData.additionalInfo || ""}
                  onChange={e => handleChange("additionalInfo", e.target.value)}
                  placeholder="Any notes..."
                  disabled={loading}
                  style={{
                    borderRadius: 14,
                    background: "#F7F7F7",
                    border: "1.5px solid #f3dadf",
                    color: "#232323"
                  }}
                />
              </div>
              <div className="col-12 d-flex flex-wrap justify-content-between align-items-center mt-4 mb-2 gap-3">
                <button
                  type="submit"
                  className="btn"
                  disabled={loading}
                  style={{
                    background: "linear-gradient(90deg,#DF2E38 0,#B71C1C 100%)",
                    color: "#fff",
                    fontWeight: 800,
                    minWidth: 140,
                    fontSize: 18,
                    borderRadius: 16,
                    border: "none",
                    boxShadow: "0 2px 8px #DF2E3820"
                  }}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={loading}
                  style={{
                    background: "#fff",
                    color: "#DF2E38",
                    fontWeight: 800,
                    minWidth: 140,
                    fontSize: 18,
                    borderRadius: 16,
                    border: "2px solid #DF2E38",
                    boxShadow: "0 2px 8px #df2e3810"
                  }}
                  onClick={handleDelete}
                >
                  Delete Event
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="text-center pb-3 px-4"
          style={{
            fontSize: 14,
            color: "#888"
          }}>
          <b style={{ color: "#DF2E38" }}>Important:</b> You must be signed in with a Google account <b>with edit access</b> to the shared calendar.<br />
          <span style={{ opacity: 0.8 }}>
            (A Google login popup will appear only if needed!)
          </span>
        </div>
      </div>
    </div>
  );
};

export default EditTournamentForm;
