import React, { useState } from "react";
import { addDocument } from "../hooks/firestore"; // adjust path if needed
import { Tournament } from "../types/event"; // adjust path if needed

const TournamentForm: React.FC = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const docId = await addDocument("tournaments", tournamentData);
    if (docId) {
      alert("Tournament created with ID: " + docId);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center mt-5">
      <div className="card p-4 shadow" style={{ maxWidth: "700px", width: "100%" }}>
        <h2 className="text-center mb-4">Add an Event</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="tourn_name">Event Name</label>
            <input type="text" id="tourn_name" className="form-control" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="event_type">Event Type</label>
            <select id="event_type" className="form-control" value={eventType} onChange={(e) => setEventType(e.target.value)} required>
              <option value="">Select an event type</option>
              <option value="extra_practice">Extra Practice</option>
              <option value="match_play">Match Play</option>
              <option value="tournament">Tournament</option>
            </select>
          </div>

          <div className="form-group mb-3">
            <label htmlFor="status">Status</label>
            <select id="status" className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} required>
              <option value="">Select status</option>
              <option value="tentative">Tentative</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="row mb-3">
            <div className="form-group col-md-6">
              <label htmlFor="date">Date</label>
              <input type="date" id="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="form-group col-md-3">
              <label htmlFor="start_time">Start Time</label>
              <input type="time" id="start_time" className="form-control" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="form-group col-md-3">
              <label htmlFor="end_time">End Time</label>
              <input type="time" id="end_time" className="form-control" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="form-group col-md-6">
              <label htmlFor="rsvp_date">RSVP Date</label>
              <input type="date" id="rsvp_date" className="form-control" value={rsvpDate} onChange={(e) => setRsvpDate(e.target.value)} />
            </div>
            <div className="form-group col-md-3">
              <label htmlFor="rsvp_time">RSVP Time</label>
              <input type="time" id="rsvp_time" className="form-control" value={rsvpTime} onChange={(e) => setRsvpTime(e.target.value)} />
            </div>
          </div>

          <div className="form-group mb-3">
            <label htmlFor="rules_tourn">Rules</label>
            <textarea id="rules_tourn" className="form-control" rows={3} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Enter rules..." />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="location">Location</label>
            <input type="text" id="location" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter address" />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="shirt_color">Shirt Color</label>
            <input type="text" id="shirt_color" className="form-control" value={shirtColor} onChange={(e) => setShirtColor(e.target.value)} placeholder="e.g., Red/Black" />
          </div>

          <div className="form-group mb-4">
            <label htmlFor="additional_info">Additional Information</label>
            <input type="text" id="additional_info" className="form-control" value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="Any notes..." />
          </div>

          <div className="text-center">
            <button type="submit" className="btn btn-primary px-4 py-2">Create Event</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentForm;
