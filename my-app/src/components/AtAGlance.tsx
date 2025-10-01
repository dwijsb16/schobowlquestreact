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
    date: string;        // "YYYY-MM-DD"
    eventName: string;
    location?: string;
    status?: string;
    startTime?: string;  // "HH:MM" or "HH:MM:SS"
    endTime?: string;
  }

  const [events, setEvents] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [linkedPlayers, setLinkedPlayers] = useState<string[]>([]);
  const [signupStatus, setSignupStatus] = useState<Record<string, string>>({});

  // --- Helpers ---
  const toLocalYYYYMMDD = (d: Date) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const timeOrMidnight = (t?: string) => (t ?? "00:00").padEnd(8, ":00");

  const formatDate = (dateStr: string) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [y, m, d] = dateStr.split("-");
    return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
  };

  // --- Fetch upcoming events in strict chronological order (date, then startTime) ---
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const todayStr = toLocalYYYYMMDD(new Date()); // only upcoming (today or later)

        // Firestore: filter to upcoming and order by date
        const tournQuery = query(
          collection(db, "tournaments"),
          where("date", ">=", todayStr),
          orderBy("date")
        );

        const snap = await getDocs(tournQuery);
        const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Tournament[];

        // Secondary client-side sort by startTime for same-day events
        rows.sort((a, b) => {
          if (a.date !== b.date) return a.date < b.date ? -1 : 1;
          const A = Date.parse(`${a.date}T${timeOrMidnight(a.startTime)}`);
          const B = Date.parse(`${b.date}T${timeOrMidnight(b.startTime)}`);
          return A - B;
        });

        setEvents(rows);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // --- Auth: figure out who is logged in and which players are linked ---
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLinkedPlayers([]);
      if (!user) return;

      // Users collection record for role/links
      // If your "users" doc id is already the uid, this could be a direct getDoc.
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("uid", "==", user.uid))
      );
      const data = usersSnap.docs[0]?.data() as any | undefined;
      if (!data) return;

      if (data.role === "player") setLinkedPlayers([user.uid]);
      else if (Array.isArray(data.linkedPlayers)) setLinkedPlayers(data.linkedPlayers);
    });
    return () => unsub();
  }, []);

  // --- For each event, compute this user's/linked players' signup status ---
  useEffect(() => {
    const run = async () => {
      if (!events.length || !linkedPlayers.length) return;

      const statuses: Record<string, string> = {};
      await Promise.all(
        events.map(async (ev) => {
          const snap = await getDocs(collection(db, "signups", ev.id, "entries"));
          const labelFor = (avail?: string) =>
            ({
              yes: "Registered",
              early: "Leaving Early",
              late: "Arriving Late",
              late_early: "Late & Early",
              no: "Not Attending",
            } as Record<string, string>)[avail ?? "yes"] ?? "Registered";

          const perPlayer = linkedPlayers.map((pid) => {
            const entry = snap.docs.find((d) => d.data().playerId === pid);
            return entry ? labelFor(entry.data().availability) : "Not Registered";
          });

          statuses[ev.id] = perPlayer.join(" / ");
        })
      );
      setSignupStatus(statuses);
    };
    run();
  }, [events, linkedPlayers]);

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
                        signupStatus[ev.id]?.includes("Registered") &&
                        !signupStatus[ev.id].includes("Not Registered")
                          ? "#6BCB77"
                          : /Late|Early/.test(signupStatus[ev.id] ?? "")
                          ? "#FFD93D"
                          : (signupStatus[ev.id] ?? "").includes("Not")
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
