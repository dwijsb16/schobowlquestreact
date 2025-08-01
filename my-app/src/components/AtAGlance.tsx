import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const RED = "#DF2E38";
const LIGHT_GREY = "#F9F9F9";
const DARK_TEXT = "#2F2F2F";
const MUTED_TEXT = "#888";
const BORDER_COLOR = "#f2d9db";

const statusColor = (status: string) => {
  switch (status) {
    case "confirmed": return "#6BCB77";
    case "cancelled": return "#FF6B6B";
    case "tentative": return "#FFD93D";
    default: return "#BDBDBD";
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
        today.setHours(0, 0, 0, 0);
        const tournQuery = query(collection(db, "tournaments"), orderBy("date"));
        const tournSnap = await getDocs(tournQuery);
        const upcoming = tournSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Tournament))
          .filter(t => t.date && new Date(t.date + "T00:00:00") >= today);
        setEvents(upcoming);
      } catch {
        setEvents([]);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLinkedPlayers([]);
      if (user) {
        const usersQuery = query(collection(db, "users"), where("uid", "==", user.uid));
        const userSnap = await getDocs(usersQuery);
        const data = userSnap.docs[0]?.data();
        if (!data) return;
        if (data.role === "player") setLinkedPlayers([user.uid]);
        else if (data.linkedPlayers) setLinkedPlayers(data.linkedPlayers);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchSignupStatuses() {
      if (!events.length || !linkedPlayers.length) return;
      const statuses: Record<string, string> = {};
      await Promise.all(events.map(async (ev) => {
        const entriesRef = collection(db, "signups", ev.id, "entries");
        const snap = await getDocs(entriesRef);
        const statusForPlayers = linkedPlayers.map(pid => {
          const entry = snap.docs.find(doc => doc.data().playerId === pid);
          if (!entry) return "Not Registered";
          const d = entry.data();
          return ({
            yes: "Registered",
            early: "Leaving Early",
            late: "Arriving Late",
            late_early: "Late & Early",
            no: "Not Attending"
          } as any)[d.availability] || "Registered";
        });
        statuses[ev.id] = statusForPlayers.join(" / ");
      }));
      setSignupStatus(statuses);
    }
    fetchSignupStatuses();
  }, [events, linkedPlayers]);

  const formatDate = (dateStr: string) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [year, month, day] = dateStr.split("-");
    return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
  };

  return (
    <div className="col-md-4">
      <div
        className="card mt-3 shadow-sm"
        style={{
          minHeight: 350,
          borderRadius: 18,
          border: `2px solid ${BORDER_COLOR}`,
          background: "#fff",
        }}
      >
        <div
          className="card-header fw-bold"
          style={{
            fontSize: 20,
            background: RED,
            color: "#fff",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          Upcoming Events
        </div>
        <div
          style={{
            maxHeight: 330,
            overflowY: "auto",
            background: LIGHT_GREY,
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            padding: "12px 16px",
          }}
        >
          {loading && <div className="text-center text-secondary py-3">Loading...</div>}
          {!loading && events.length === 0 && (
            <div className="text-center text-muted py-4">No upcoming events.</div>
          )}
          {events.map((ev) => (
            <div
              key={ev.id}
              className="d-flex align-items-start justify-content-between mb-4"
              style={{
                borderBottom: "1px solid #e9cfd1",
                paddingBottom: 8,
                fontSize: 15,
                color: DARK_TEXT,
              }}
            >
              <div style={{ maxWidth: "70%" }}>
                <Link
                  to={`/tournament/${ev.id}`}
                  style={{
                    fontWeight: 700,
                    textDecoration: "none",
                    color: RED,
                    display: "block",
                    fontSize: 16,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "#222", marginRight: 8, fontWeight: 800 }}>
                    {formatDate(ev.date)}
                  </span>
                  {ev.eventName}
                </Link>
                <div style={{ fontSize: 13, color: MUTED_TEXT }}>
                  {ev.location || <span style={{ color: "#d3c4c5" }}>No location</span>}
                </div>
              </div>
              <div className="text-end" style={{ minWidth: 120 }}>
                <div
                  style={{
                    background: statusColor(ev.status || "unknown"),
                    color: "#232323",
                    fontWeight: 700,
                    fontSize: 13,
                    padding: "3px 10px",
                    borderRadius: 13,
                    textAlign: "center",
                    marginBottom: 6,
                    whiteSpace: "nowrap",
                    border: ev.status === "cancelled" ? `2px solid #FF6B6B` : "none",
                  }}
                >
                  {ev.status ? ev.status.charAt(0).toUpperCase() + ev.status.slice(1) : "TBA"}
                </div>
                {currentUser && (
                  <div
                    style={{
                      background:
                        signupStatus[ev.id]?.includes("Registered") && !signupStatus[ev.id].includes("Not Registered")
                          ? "#6BCB77"
                          : signupStatus[ev.id]?.match(/Late|Early/)
                          ? "#FFD93D"
                          : signupStatus[ev.id]?.includes("Not")
                          ? "#FF6B6B"
                          : "#dedede",
                      color: "#232323",
                      fontWeight: 700,
                      fontSize: 13,
                      padding: "3px 10px",
                      borderRadius: 13,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {linkedPlayers.length === 0 ? "(no player linked)" : signupStatus[ev.id]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AtAGlanceCalendar;
