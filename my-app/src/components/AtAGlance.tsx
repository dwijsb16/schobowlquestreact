import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { Link } from "react-router-dom";

const RED = "#DF2E38";
const LIGHT_GREY = "#F7F7F7";
const DARK_GREY = "#444";
const MUTED_GREY = "#888";
const CARD_BORDER = "#ffe6e9";

const statusColor = (status: string) => {
  switch (status) {
    case "confirmed": return "#6BCB77"; // green
    case "cancelled": return "#FF6B6B"; // red
    case "tentative": return "#FFD93D"; // yellow
    default: return "#BDBDBD"; // gray
  }
};

const AtAGlanceCalendar: React.FC = () => {
  interface Tournament {
    id: string;
    date: string;
    eventName: string;
    location?: string;
    status?: string;
  }

  const [events, setEvents] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Don't show past events
        const tournQuery = query(collection(db, "tournaments"), orderBy("date"));
        const tournSnap = await getDocs(tournQuery);
        const tourns = tournSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Tournament))
          .filter(t => t.date && new Date(t.date + "T00:00:00") >= today);
        setEvents(tourns);
      } catch (e) {
        setEvents([]);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [year, month, day] = dateStr.split("-");
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
  };

  return (
    <div className="col-md-4">
      <div
        className="card mt-3 shadow-sm"
        style={{
          minHeight: 350,
          borderRadius: 18,
          border: `2.5px solid ${CARD_BORDER}`,
          background: "#fff",
        }}
      >
        <div
          className="card-header fw-bold"
          style={{
            fontSize: 19,
            background: RED,
            color: "#fff",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            fontWeight: 800,
            letterSpacing: 1.3,
          }}
        >
          Upcoming Events
        </div>
        <div style={{
          maxHeight: 320,
          overflowY: "auto",
          background: LIGHT_GREY,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
        }}>
          {events.length === 0 && !loading && (
            <div className="text-center text-muted py-4">No upcoming events.</div>
          )}
          {events.map((ev) => (
            <div
              key={ev.id}
              className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2"
              style={{
                borderColor: "#f8d0d8",
                padding: "0 16px",
                fontSize: 16,
                color: DARK_GREY,
                fontWeight: 500,
              }}
            >
              <div>
                <Link
                  to={`/tournament/${ev.id}`}
                  style={{
                    textDecoration: "none",
                    fontWeight: 700,
                    color: RED,
                    fontSize: 17,
                    letterSpacing: 0.2,
                    marginRight: 8,
                  }}
                >
                  <span style={{
                    fontWeight: 800,
                    color: "#232323",
                    marginRight: 10,
                    fontSize: 16,
                  }}>{formatDate(ev.date)}</span>
                  {ev.eventName}
                </Link>
                <div style={{ fontSize: 13, color: MUTED_GREY }}>
                  {ev.location || <span style={{ color: "#d6bfc1" }}>No location</span>}
                </div>
              </div>
              <span
                style={{
                  background: statusColor(ev.status || "unknown"),
                  color: "#232323",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "7px 17px",
                  borderRadius: 16,
                  marginLeft: 6,
                  minWidth: 88,
                  textAlign: "center",
                  border: ev.status === "cancelled" ? `2px solid #FF6B6B` : "none",
                  boxShadow: "0 1px 4px #0000000a"
                }}>
                {ev.status ? ev.status.charAt(0).toUpperCase() + ev.status.slice(1) : "TBA"}
              </span>
            </div>
          ))}
          {loading && (
            <div className="text-center text-secondary py-3">Loading...</div>
          )}
        </div>
      </div>
      <style>
        {`
          .card::-webkit-scrollbar,
          .card-body::-webkit-scrollbar {
            width: 8px;
            background: #f6f6f6;
            border-radius: 6px;
          }
          .card::-webkit-scrollbar-thumb,
          .card-body::-webkit-scrollbar-thumb {
            background: #efd1d3;
            border-radius: 6px;
          }
        `}
      </style>
    </div>
  );
};

export default AtAGlanceCalendar;
