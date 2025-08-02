import React, { JSX, useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface TournamentCard {
  rsvpDate: string;
  id: string;
  eventName: string;
  date: string; // YYYY-MM-DD
  location?: string;
  status?: string;
  eventType?: string;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "success",
  tentative: "warning",
  cancelled: "danger",
};
const EVENT_TYPE_COLORS: Record<string, string> = {
  tournament: "primary",
  match_play: "info",
  extra_practice: "secondary",
};
function formatRsvpString(rsvpDate?: string): string {
  if (!rsvpDate) return "";
  const d = new Date(rsvpDate + "T00:00:00");
  return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}, ${d.getFullYear()}`;
}


function formatDateString(date: string) {
  const d = new Date(date + "T00:00:00");
  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate().toString().padStart(2, "0"),
    year: d.getFullYear(),
    weekday: d.toLocaleString("en-US", { weekday: "short" }),
  };
}
function getRsvpBadge(rsvpDate?: string): JSX.Element | null {
  if (!rsvpDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rsvp = new Date(rsvpDate + "T00:00:00");

  const diffDays = Math.ceil((rsvp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = `${rsvp.toLocaleString("en-US", {
    month: "short",
  })} ${rsvp.getDate()}, ${rsvp.getFullYear()}`;

  if (diffDays < 0) {
    return (
      <div className="text-danger mb-2" style={{ fontWeight: 600 }}>
        ❌ RSVP Deadline Passed ({formatted})
      </div>
    );
  }

  if (diffDays === 0) {
    return (
      <div className="text-danger mb-2" style={{ fontWeight: 600 }}>
        ⚠️ RSVP by TODAY ({formatted})
      </div>
    );
  }

  if (diffDays === 1) {
    return (
      <div className="text-warning mb-2" style={{ fontWeight: 600 }}>
        ⚠️ RSVP by TOMORROW ({formatted})
      </div>
    );
  }

  if (diffDays <= 3) {
    return (
      <div className="text-danger mb-2" style={{ fontWeight: 600 }}>
        🔴 RSVP by {formatted}
      </div>
    );
  }

  return (
    <div className="text-muted mb-2" style={{ fontWeight: 500 }}>
      RSVP by: {formatted}
    </div>
  );
}


const Cards: React.FC = () => {
  const [tournaments, setTournaments] = useState<TournamentCard[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
const [linkedPlayers, setLinkedPlayers] = useState<string[]>([]); // array of player IDs (strings)
const [signupStatus, setSignupStatus] = useState<Record<string, string>>({}); // tournamentId -> status string


  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const q = query(collection(db, "tournaments"), orderBy("date"));
        const querySnapshot = await getDocs(q);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const data: TournamentCard[] = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as TournamentCard[];

        // Only keep tournaments whose date >= today, then get the 3 closest
        const upcoming = data
          .filter((tourn) => {
            if (!tourn.date) return false;
            const tournDate = new Date(tourn.date + "T00:00:00");
            return tournDate >= today;
          })
          .sort((a, b) => (a.date > b.date ? 1 : -1))
          .slice(0, 3);

        setTournaments(upcoming);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      }
    };

    fetchTournaments();
  }, []);
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLinkedPlayers([]);
      if (user) {
        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        const data = userDoc.docs[0]?.data();
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
      if (!tournaments.length || !linkedPlayers.length) {
        setSignupStatus({});
        return;
      }
      const statuses: Record<string, string> = {};
  
      await Promise.all(tournaments.map(async (tourn) => {
        const entriesRef = collection(db, "signups", tourn.id, "entries");
        const snap = await getDocs(entriesRef);
  
        const statusForPlayers = linkedPlayers.map(pid => {
          const entry = snap.docs.find(doc => doc.data().playerId === pid);
          return entry ? "Registered" : "Not Registered";
        });
  
        // Join with slashes if >1 player, else just string
        statuses[tourn.id] = statusForPlayers.length
          ? statusForPlayers.join(" / ")
          : "(no player linked)";
      }));
  
      setSignupStatus(statuses);
    }
    fetchSignupStatuses();
  }, [tournaments, linkedPlayers]);
    

  return (
    <div className="row justify-content-center" style={{ padding: "32px 8px 32px 8px" }}>
      {tournaments.length === 0 && (
        <div className="col-12 text-center text-muted my-5">
          <h4>No upcoming events!</h4>
        </div>
      )}
      {tournaments.map((tourn) => {
        const { month, day, year, weekday } = formatDateString(tourn.date);
        return (
          <div className="col-md-6 col-xl-4 mb-5" key={tourn.id}>
            <div className="card shadow-sm h-100" style={{ padding: "16px 0" }}>
              <div className="d-flex justify-content-center" style={{ marginTop: "-1.7em" }}>
                <div style={{
                  background: "#f6f6f6",
                  border: "2px solid #007bff",
                  borderRadius: "1em",
                  width: "90px",
                  height: "90px",
                  boxShadow: "0 2px 10px rgba(0,0,0,.05)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{ fontWeight: 700, fontSize: "1.1em", color: "#007bff", letterSpacing: 1 }}>
                    {month}
                  </span>
                  <span style={{ fontWeight: 900, fontSize: "2.3em", lineHeight: 1, color: "#222" }}>
                    {day}
                  </span>
                  <span style={{ fontSize: "0.9em", color: "#888" }}>
                    {weekday}
                  </span>
                </div>
              </div>
              <div className="card-body pt-3 text-center">
                <h5 className="card-title mb-1" style={{ fontWeight: 700 }}>{tourn.eventName}</h5>
                <div className="mb-2">
                  {tourn.status && (
                    <span className={`badge bg-${STATUS_COLORS[tourn.status] || "secondary"} mx-1`}>
                      {tourn.status.charAt(0).toUpperCase() + tourn.status.slice(1)}
                    </span>
                  )}
                  {tourn.eventType && (
                    <span className={`badge bg-${EVENT_TYPE_COLORS[tourn.eventType] || "secondary"} mx-1`}>
                      {tourn.eventType.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                    </span>
                  )}
                </div>
                {tourn.location && (
  <div className="mb-2 text-muted" style={{ fontSize: 15 }}>
    {tourn.location}
  </div>
)}

{getRsvpBadge(tourn.rsvpDate)}

{/* Registration status badge (only if player or parent logged in) */}
{currentUser && (
  <div style={{ marginTop: 6, marginBottom: 5 }}>
    <span
      className="badge"
      style={{
        background:
          signupStatus[tourn.id]?.includes("Registered") && !signupStatus[tourn.id].includes("Not Registered")
            ? "#6BCB77"
            : signupStatus[tourn.id]?.includes("Registered")
            ? "#FFD166"
            : "#f0f0f0",
        color:
          signupStatus[tourn.id] === "(no player linked)" ? "#B71C1C"
            : signupStatus[tourn.id]?.includes("Registered") && !signupStatus[tourn.id].includes("Not Registered") ? "#fff"
            : signupStatus[tourn.id]?.includes("Registered") ? "#8A6D00"
            : "#888",
        fontWeight: 700,
        fontSize: 13,
        padding: "6px 13px",
        borderRadius: 12,
        border: "1.5px solid #e3e3e3"
      }}
    >
      {linkedPlayers.length === 0
        ? "(no player linked)"
        : signupStatus[tourn.id]}
    </span>
  </div>
)}

<div>
{(() => {
  // Determine status: all Registered = Edit, else Register
  const statusArr = signupStatus[tourn.id]
    ? signupStatus[tourn.id].split(" / ").map(s => s.trim())
    : [];
  const allRegistered = statusArr.length > 0 && statusArr.every(s => s === "Registered");
  return (
    <a
      href={`/tournament/${tourn.id}`}
      className={
        allRegistered
          ? "btn btn-success btn-sm mt-2"
          : "btn btn-outline-primary btn-sm mt-2"
      }
    >
      {allRegistered ? "Edit Signup" : "Register"}
    </a>
  );
})()}

</div>

              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Cards;
