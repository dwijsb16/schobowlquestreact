// TeamsSection.jsx
import React from "react";
interface Team {
  id: string;
  name: string;
  players: Array<{ signupId: string; isCaptain?: boolean }>;
}

interface Signup {
  id: string;
  playerId: string;
}

interface Player {
  firstName: string;
  lastName: string;
}

interface TeamsSectionProps {
  teams: Team[];
  signups: Signup[];
  playerMap: Record<string, Player>;
}

export default function TeamsSection({ teams, signups, playerMap }: TeamsSectionProps) {
  return (
    <div className="row">
      {teams.length === 0 && (
        <div className="col-12 text-center text-muted">
          <em>No teams have been added for this tournament yet.</em>
        </div>
      )}
      {teams.map((team) => {
        const teamPlayers = team.players
          .map((tp) => {
            const signup = signups.find((s) => s.id === tp.signupId);
            if (!signup) return null;
            const player = playerMap[signup.playerId];
            return {
              ...tp,
              ...signup,
              fullName: player ? `${player.firstName} ${player.lastName}` : "Unknown",
            };
          })
          .filter(Boolean);
        const captain = teamPlayers.find((tp) => tp?.isCaptain);
        return (
          <div className="col-md-4 mb-3" key={team.id}>
            <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: "1.5px solid #DF2E38", background: "#FFF7F7" }}>
              <div className="card-body">
                <h5 className="card-title" style={{ color: "#DF2E38", fontWeight: 700 }}>
                  {team.name}
                </h5>
                <div style={{ fontSize: 16 }}>
                  <b>Captain:</b>{" "}
                  {captain ? (
                    <span style={{ color: "#B71C1C" }}>{captain.fullName}</span>
                  ) : (
                    <span className="text-muted">None</span>
                  )}
                </div>
                <div className="mt-2">
                  <b>Players:</b>
                  <ul style={{ marginBottom: 0 }}>
                    {teamPlayers.length === 0 && (
                      <li>
                        <em className="text-muted">No players assigned</em>
                      </li>
                    )}
                    {teamPlayers.map((tp, idx) => {
                      if (!tp) return null;
                      return (
                        <li key={tp.signupId}>
                          <span style={{ color: "#B71C1C", fontWeight: tp.isCaptain ? 700 : 500 }}>
                            {tp.fullName}
                          </span>
                          {tp.isCaptain && (
                            <span className="badge ms-2" style={{ background: "#DF2E38", color: "#fff", borderRadius: "10px", fontSize: "0.9em", fontWeight: 700 }}>
                              Captain
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
