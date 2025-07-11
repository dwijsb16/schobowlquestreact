import React, { useEffect, useState } from "react";
// import your Firestore and Google Calendar functions here
import { getCollection } from "../hooks/firestore";
import { getDocumentById } from "../hooks/firestore";
import { updateDocumentFields } from "../hooks/firestore";
import { deleteDocument } from "../hooks/firestore";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

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

  // Fetch all tournaments on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      setAlert(null);
      try {
        // Replace with your Firestore fetch logic!
        const data = await fetchTournaments(); // returns array of tournaments
        setTournaments(data);
      } catch (err) {
        setAlert({ type: "error", message: "Could not load tournaments." });
      }
      setLoading(false);
    }
    load();
  }, []);

  // Fetch the selected tournament
  async function handleGo() {
    setLoading(true);
    setAlert(null);
    try {
      // Replace with your logic to fetch one tournament by ID
      const tourn = await fetchTournamentById(selectedTournId);
      setFormData(tourn);
    } catch (err) {
      setAlert({ type: "error", message: "Could not load selected tournament." });
    }
    setLoading(false);
  }

  // --- Form Handling ---
  function handleChange(field: string, value: any) {
    setFormData({ ...formData, [field]: value });
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      // Replace with your Firestore update logic!
      await updateTournament(formData.id, formData);

      // Replace with your Google Calendar update logic!
      // You'll need to store googleEventId or similar on each tournament.
      await updateGoogleCalendarEvent(formData.googleEventId, formData);

      setAlert({ type: "success", message: "Tournament updated!" });
    } catch (err) {
      setAlert({ type: "error", message: "Failed to update tournament." });
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this tournament? This cannot be undone.")) return;
    setLoading(true);
    setAlert(null);
    try {
      // Firestore delete
      await deleteTournament(formData.id);
      // Google Calendar delete
      await deleteGoogleCalendarEvent(formData.googleEventId);

      setAlert({ type: "success", message: "Tournament deleted." });
      setFormData(null);
      setSelectedTournId("");
      // Optionally refresh tournaments list
      setTournaments(await fetchTournaments());
    } catch (err) {
      setAlert({ type: "error", message: "Failed to delete tournament." });
    }
    setLoading(false);
  }

  // -- Dropdown + "Go" Button --
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
                <input
                  type="time"
                  className="form-control rounded-3"
                  value={formData.startTime || ""}
                  onChange={e => handleChange("startTime", e.target.value)}
                  required
                  disabled={loading}
                />
                {/* For react-time-picker, replace above with your custom component */}
              </div>
              <div className="col-6 col-md-4 mb-2">
                <label className="fw-semibold mb-1">End Time:</label>
                <input
                  type="time"
                  className="form-control rounded-3"
                  value={formData.endTime || ""}
                  onChange={e => handleChange("endTime", e.target.value)}
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

// ----
// Replace these with your real Firestore & Google Calendar logic!
// For now, these are dummy placeholders:

async function fetchTournaments() {
  return await getCollection("tournaments");
}

async function fetchTournamentById(id: string) {
  return await getDocumentById("tournaments", id);
}


async function updateTournament(id: string, data: any) {
  // e.g. return await updateDocumentFields("tournaments", id, data);
  return await updateDocumentFields("tournaments", id, data);
}

async function deleteTournament(id: string) {
  return await deleteDocument("tournaments", id);
}

async function updateGoogleCalendarEvent(googleEventId: string, eventObj: any) {
  return await gapi.client.calendar.events.update({
    calendarId: CALENDAR_ID,
    eventId: googleEventId,
    resource: eventObj,
  });
}

async function deleteGoogleCalendarEvent(googleEventId: string) {
  return await gapi.client.calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId: googleEventId,
  });
}
