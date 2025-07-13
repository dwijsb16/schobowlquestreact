import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";

const Accordion: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    const fetchAll = async () => {
      // Get all tournaments
      const tournSnap = await getDocs(collection(db, "tournaments"));
      const tourns = tournSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // For each tournament, get signups and teams
      const results = await Promise.all(
        tourns.map(async (tourn: any) => {
          // Get signups (players)
          let players: string[] = [];
          let carpoolers: string[] = [];
          let moderators: string[] = [];

          try {
            const signupsSnap = await getDocs(collection(db, "signups", tourn.id, "entries"));
            signupsSnap.forEach(snap => {
              const s = snap.data();
              if (s.playerName) players.push(s.playerName);
              if (s.carpool?.includes("can-drive")) carpoolers.push(s.playerName);
              if (s.canModerate) moderators.push(s.playerName);
            });
          } catch { /* ignore if not found */ }

          // Get teams
          let teams: string[] = [];
          try {
            const teamsSnap = await getDocs(collection(db, "tournaments", tourn.id, "teams"));
            teams = teamsSnap.docs.map(d => d.data().name).filter(Boolean);
          } catch { /* ignore if not found */ }

          return {
            ...tourn,
            players,
            carpoolers,
            moderators,
            teams,
          };
        })
      );
      setTournaments(results);
    };
    fetchAll();
  }, []);

  return (
    <div id="accordion1" role="tablist">
      {tournaments.map((tournament, index) => (
        <div className="card mb-2" key={tournament.id}>
          <div className="card-header" role="tab" id={`heading${index}`}>
            <h5 className="mb-0">
              <a
                data-toggle="collapse"
                href={`#collapse${index}`}
                role="button"
                aria-expanded={expanded === index}
                aria-controls={`collapse${index}`}
                onClick={() => setExpanded(expanded === index ? null : index)}
                style={{ cursor: "pointer", textDecoration: "none", color: "#1469a8" }}
              >
                {tournament.eventName} {tournament.date ? `(${tournament.date})` : ""}
              </a>
            </h5>
          </div>
          <div
            id={`collapse${index}`}
            className={`collapse${expanded === index ? " show" : ""}`}
            role="tabpanel"
            aria-labelledby={`heading${index}`}
            data-parent="#accordion1"
          >
            <div className="card-body">
              <p><b>Location:</b> {tournament.location || <span className="text-muted">N/A</span>}</p>
              <p>
                <b>Start/End Time:</b>{" "}
                {tournament.startTime ? `Start: ${tournament.startTime}` : ""}
                {tournament.endTime ? `, End: ${tournament.endTime}` : ""}
                {!tournament.startTime && !tournament.endTime && <span className="text-muted">N/A</span>}
              </p>
              <p>
                <b>Players Coming:</b>{" "}
                {tournament.players.length > 0
                  ? tournament.players.join(", ")
                  : <span className="text-muted">None yet</span>}
              </p>
              <p>
                <b>Teams:</b>{" "}
                {tournament.teams.length > 0
                  ? tournament.teams.join(", ")
                  : <span className="text-muted">No teams yet</span>}
              </p>
              <p><b>Shirt Color:</b> {tournament.shirtColor || <span className="text-muted">N/A</span>}</p>
              <p>
                <b>People who can Carpool:</b>{" "}
                {tournament.carpoolers.length > 0
                  ? tournament.carpoolers.join(", ")
                  : <span className="text-muted">None</span>}
              </p>
              <p>
                <b>People who can Moderate:</b>{" "}
                {tournament.moderators.length > 0
                  ? tournament.moderators.join(", ")
                  : <span className="text-muted">None</span>}
              </p>
              {tournament.additionalInfo && (
                <p>
                  <b>Notes:</b> {tournament.additionalInfo}
                </p>
              )}
              <div className="d-flex gap-3 mt-3">
                <Link to={`/edit-tournament`} className="btn btn-warning">
                  Edit Tournament Info
                </Link>
                <Link to={`/make-teams`} className="btn btn-success">
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
  );
};

export default Accordion;
