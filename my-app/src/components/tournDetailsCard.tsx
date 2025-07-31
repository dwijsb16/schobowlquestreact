// TournamentDetailsCard.jsx
import React from "react";
import { format, parseISO } from "date-fns";

function formatDateWithDay(dateString: string) {
  if (!dateString) return "";
  const date = parseISO(dateString);
  return format(date, "EEEE, MMMM d, yyyy");
}
function formatTime12hr(timeString: string) {
  if (!timeString) return "";
  let [h, m] = timeString.split(":");
  const hourNum = Number(h);
  const ampm = hourNum >= 12 ? "PM" : "AM";
  const hour12 = ((hourNum + 11) % 12 + 1);
  return `${hour12}:${m.padStart(2, "0")} ${ampm}`;
}
const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) =>
  value ? (
    <div className="d-flex align-items-baseline justify-content-center mb-2">
      <span style={{ fontWeight: 700, color: "#B71C1C", minWidth: 100 }}>{label}:</span>
      <span style={{ marginLeft: 8, fontWeight: 500, color: "#232323" }}>{value}</span>
    </div>
  ) : null;

interface Tournament {
  eventName: string;
  date: string;
  location: string;
  startTime?: string;
  endTime?: string;
  rsvpDate?: string;
  rsvpTime?: string;
  rules?: string;
  shirtColor?: string;
  additionalInfo?: string;
  eventType?: string;
  status?: string;
}

export default function TournamentDetailsCard({ tournament }: { tournament: Tournament }) {
  return (
    <div
      className="card shadow mb-5"
      style={{ background: "#fff", border: "2px solid #DF2E38", borderRadius: 20 }}
    >
      <div className="card-body text-center px-5 py-4">
        <h1 className="display-5 mb-3" style={{ color: "#DF2E38", fontWeight: 900 }}>
          {tournament.eventName}
        </h1>
        <div style={{ fontSize: 18, color: "#B71C1C", fontWeight: 600, marginBottom: 8 }}>
          {formatDateWithDay(tournament.date)}
        </div>
        <InfoRow label="Location" value={tournament.location} />
        <InfoRow
          label="Time"
          value={
            tournament.startTime && tournament.endTime
              ? `${formatTime12hr(tournament.startTime)} — ${formatTime12hr(tournament.endTime)}`
              : tournament.startTime
              ? `${formatTime12hr(tournament.startTime)}`
              : tournament.endTime
              ? `${formatTime12hr(tournament.endTime)}`
              : "—"
          }
        />
        <InfoRow
          label="RSVP By"
          value={
            tournament.rsvpDate
              ? tournament.rsvpTime
                ? `${formatDateWithDay(tournament.rsvpDate)} at ${formatTime12hr(
                    tournament.rsvpTime
                  )}`
                : formatDateWithDay(tournament.rsvpDate)
              : null
          }
        />
        <InfoRow label="Rules" value={tournament.rules} />
        <InfoRow label="Shirt Color" value={tournament.shirtColor} />
        <InfoRow label="Notes" value={tournament.additionalInfo} />
        <div className="mt-3 mb-1 d-flex justify-content-center flex-wrap gap-2">
          {tournament.eventType && (
            <span
              className="badge"
              style={{
                fontSize: 15,
                background: "#fff0f0",
                color: "#B71C1C",
                border: "1px solid #DF2E38",
                fontWeight: 700,
              }}
            >
              {tournament.eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          )}
          {tournament.status && (
            <span
              className="badge"
              style={{
                background:
                  tournament.status === "confirmed"
                    ? "#6BCB77"
                    : tournament.status === "cancelled"
                    ? "#F96D6D"
                    : "#FFD166",
                color: tournament.status === "tentative" ? "#8A6D00" : "#fff",
                fontSize: 15,
                fontWeight: 700,
                padding: "9px 14px",
                borderRadius: 12,
              }}
            >
              {tournament.status === "confirmed"
                ? "Confirmed"
                : tournament.status === "tentative"
                ? "Tentative"
                : "Cancelled"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
