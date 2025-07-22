import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";


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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
const [linkedPlayers, setLinkedPlayers] = useState<string[]>([]);
const [signupStatus, setSignupStatus] = useState<Record<string, string>>({});


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
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLinkedPlayers([]);
      if (user) {
        // Get user data from Firestore
        const usersQuery = query(collection(db, "users"), where("uid", "==", user.uid));
        const userSnap = await getDocs(usersQuery);
        const data = userSnap.docs[0]?.data();
        if (!data) return;
        if (data.role === "player") {
          setLinkedPlayers([user.uid]);
        } else if (data.linkedPlayers) {
          setLinkedPlayers(data.linkedPlayers);
        }
      }
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    async function fetchSignupStatuses() {
      if (!events.length || !linkedPlayers.length) {
        setSignupStatus({});
        return;
      }
      const statuses: Record<string, string> = {};
      await Promise.all(events.map(async (ev) => {
        const entriesRef = collection(db, "signups", ev.id, "entries");
        const snap = await getDocs(entriesRef);
        const statusForPlayers = linkedPlayers.map(pid => {
          const entry = snap.docs.find(doc => doc.data().playerId === pid);
          if (!entry) return "Not Registered";
          const d = entry.data();
          if (d.availability === "yes") return "Registered";
          if (d.availability === "early") return "Leaving Early";
          if (d.availability === "late") return "Arriving Late";
          if (d.availability === "late_early") return "Late & Early";
          if (d.availability === "no") return "Not Attending";
          return "Registered";
        });
        // Show multiple players with slash
        statuses[ev.id] = statusForPlayers.length
          ? statusForPlayers.join(" / ")
          : "(no player linked)";
      }));
      setSignupStatus(statuses);
    }
    fetchSignupStatuses();
  }, [events, linkedPlayers]);
  
  

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
    fontSize: 13,
    padding: "3px 11px",
    borderRadius: 13,
    minWidth: 75,
    textAlign: "center",
    border: ev.status === "cancelled" ? `2px solid #FF6B6B` : "none",
    boxShadow: "0 1px 4px #0000000a",
    marginLeft: 6,
    whiteSpace: "nowrap", // prevent wrapping!
    lineHeight: 1.2
  }}
>
  {ev.status ? ev.status.charAt(0).toUpperCase() + ev.status.slice(1) : "TBA"}
</span>

              {currentUser && (
  <span
  style={{
    background:
      signupStatus[ev.id]?.includes("Registered") && !signupStatus[ev.id].includes("Not Registered")
        ? "#6BCB77"
        : signupStatus[ev.id]?.includes("Leaving Early") || signupStatus[ev.id]?.includes("Arriving Late") || signupStatus[ev.id]?.includes("Late & Early")
        ? "#FFD93D"
        : signupStatus[ev.id]?.includes("Not Registered") || signupStatus[ev.id]?.includes("Not Attending")
        ? "#FF6B6B"
        : "#eeeeee",
    color: "#232323",
    fontWeight: 700,
    fontSize: 13,
    padding: "3px 11px",
    borderRadius: 13,
    border: "1.5px solid #e3e3e3",
    marginLeft: 8,
    minWidth: 75,
    textAlign: "center",
    display: "inline-block",
    whiteSpace: "nowrap", // prevent wrap
    lineHeight: 1.2
  }}
>
  {linkedPlayers.length === 0
    ? "(no player linked)"
    : signupStatus[ev.id]}
</span>

)}

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
