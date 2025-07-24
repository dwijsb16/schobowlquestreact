import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import Footer from "../components/footer";

// --- SVG Chevron Icon ---
const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width="24"
    height="24"
    style={{
      transform: open ? "rotate(90deg)" : "rotate(0deg)",
      transition: "transform .22s cubic-bezier(.87, .18, .51, 1.15)",
      verticalAlign: "middle"
    }}
    viewBox="0 0 24 24"
    fill="none"
  >
    <path d="M9 6l6 6-6 6" stroke="#DF2E38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Accordion: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    const fetchAll = async () => {
      // Get all tournaments
      const tournSnap = await getDocs(collection(db, "tournaments"));
      const tourns = tournSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // For each tournament, get signups, teams, etc
      const results = await Promise.all(
        tourns.map(async (tourn: any) => {
          let players: string[] = [];
          let carpoolers: string[] = [];
          let moderators: string[] = [];
          let scorekeepers: string[] = [];

          try {
            const signupsSnap = await getDocs(collection(db, "signups", tourn.id, "entries"));
            const signupDocs = signupsSnap.docs.map(snap => snap.data());
            const playerIds = signupDocs.map(s => s.playerId).filter(Boolean);

            // Fetch player names from players collection
            const playerSnaps = await Promise.all(
              playerIds.map(pid => getDoc(doc(db, "players", pid)))
            );
            const playerNames = playerSnaps.map(
              psnap => psnap.exists() ? `${psnap.data().firstName} ${psnap.data().lastName}` : "Unknown"
            );

            players = playerNames;
            carpoolers = signupDocs
              .map((s, i) =>
                s.carpool?.includes("can-drive") ? playerNames[i] : null
              )
              .filter((x): x is string => !!x);
            moderators = signupDocs
              .map((s, i) =>
                s.canModerate ? playerNames[i] : null
              )
              .filter((x): x is string => !!x);
            scorekeepers = signupDocs
              .map((s, i) =>
                s.canScorekeep ? playerNames[i] : null
              )
              .filter((x): x is string => !!x);
          } catch { /* ignore */ }

          // Teams logic stays the same
          let teams: string[] = [];
          try {
            const teamsSnap = await getDocs(collection(db, "tournaments", tourn.id, "teams"));
            teams = teamsSnap.docs.map(d => d.data().name).filter(Boolean);
          } catch { /* ignore */ }

          return {
            ...tourn,
            players,
            carpoolers,
            moderators,
            scorekeepers,
            teams,
          };
        })
      );
      setTournaments(results);
    };
    fetchAll();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ flex: 1 }}>
        {tournaments.map((tournament, index) => (
          <div
            className="card mb-3 border-0 shadow-sm"
            key={tournament.id}
            style={{
              borderLeft: "6px solid #DF2E38",
              borderRadius: 18,
              background: "#fff",
              boxShadow: "0 2px 18px #FFD6E115"
            }}
          >
            <div
              className="card-header d-flex align-items-center justify-content-between"
              style={{
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                background: "#fff",
                padding: "1rem 1.3rem",
                cursor: "pointer"
              }}
              onClick={() => setExpanded(expanded === index ? null : index)}
            >
              <div style={{ fontWeight: 700, fontSize: 20, color: "#232323", letterSpacing: 0.2 }}>
                {tournament.eventName}{" "}
                <span style={{ color: "#666", fontWeight: 400, fontSize: 15 }}>
                  {tournament.date ? `(${tournament.date})` : ""}
                </span>
              </div>
              <Chevron open={expanded === index} />
            </div>
            <div
              className={`collapse${expanded === index ? " show" : ""}`}
              style={{
                background: "#fafbfc",
                borderBottomLeftRadius: 18,
                borderBottomRightRadius: 18,
                borderTop: "1px solid #f0f0f0"
              }}
              id={`collapse${index}`}
              role="tabpanel"
              aria-labelledby={`heading${index}`}
            >
              <div className="card-body" style={{ color: "#232323" }}>
                <p><b style={{color:"#DF2E38"}}>Location:</b> {tournament.location || <span className="text-muted">N/A</span>}</p>
                <p>
                  <b style={{color:"#232323"}}>Start/End Time:</b>{" "}
                  {tournament.startTime ? `Start: ${tournament.startTime}` : ""}
                  {tournament.endTime ? `, End: ${tournament.endTime}` : ""}
                  {!tournament.startTime && !tournament.endTime && <span className="text-muted">N/A</span>}
                </p>
                <p>
                  <b style={{color:"#232323"}}>Players Coming:</b>{" "}
                  {tournament.players.length > 0
                    ? tournament.players.join(", ")
                    : <span className="text-muted">None yet</span>}
                </p>
                <p>
                  <b style={{color:"#232323"}}>Teams:</b>{" "}
                  {tournament.teams.length > 0
                    ? tournament.teams.join(", ")
                    : <span className="text-muted">No teams yet</span>}
                </p>
                <p><b style={{color:"#232323"}}>Shirt Color:</b> {tournament.shirtColor || <span className="text-muted">N/A</span>}</p>
                <p>
                  <b style={{color:"#232323"}}>People who can Carpool:</b>{" "}
                  {tournament.carpoolers.length > 0
                    ? tournament.carpoolers.join(", ")
                    : <span className="text-muted">None</span>}
                </p>
                <p>
                  <b style={{color:"#232323"}}>People who can Moderate:</b>{" "}
                  {tournament.moderators.length > 0
                    ? tournament.moderators.join(", ")
                    : <span className="text-muted">None</span>}
                </p>
                <p>
                  <b style={{color:"#232323"}}>People who can Scorekeep:</b>{" "}
                  {tournament.scorekeepers.length > 0
                    ? tournament.scorekeepers.join(", ")
                    : <span className="text-muted">None</span>}
                </p>
                {tournament.additionalInfo && (
                  <p>
                    <b style={{color:"#232323"}}>Notes:</b> {tournament.additionalInfo}
                  </p>
                )}
                <div className="d-flex gap-3 mt-3">
                  <Link to={`/edit-tournament`} className="btn btn-danger rounded-pill px-4">
                    Edit Tournament Info
                  </Link>
                  <Link to={`/coaches/make-teams`} className="btn btn-dark rounded-pill px-4">
                    Add Teams
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        {tournaments.length === 0 && (
          <div className="text-center text-muted py-5">
            No tournaments found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Accordion;
