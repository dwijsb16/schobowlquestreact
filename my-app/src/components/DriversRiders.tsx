import React from "react";

interface Signup {
  playerId: string;
  carpool: string;
  driveCapacity?: number;
}

interface Player {
  firstName: string;
  lastName: string;
}

interface CombinedDriversRidersSectionProps {
  signups: Signup[];
  playerMap: Record<string, Player>;
}

export default function CombinedDriversRidersSection({ signups, playerMap }: CombinedDriversRidersSectionProps) {
  const drivers = signups.filter((s) => s.carpool === "can-drive");
  const riders = signups.filter((s) => s.carpool === "needs-ride");
  return (
    <div className="card shadow mb-4" style={{ borderRadius: 16, border: "1.5px solid #DF2E38", background: "#FFF7F7" }}>
      <div className="card-body row">
        {/* Drivers */}
        <div className="col-md-6 mb-2">
          <h4 style={{ color: "#DF2E38", fontWeight: 700 }}>Drivers & Seats</h4>
          <ul style={{ fontSize: 17 }}>
            {drivers.length === 0 ? (
              <li className="text-muted">No drivers yet!</li>
            ) : (
              drivers.map((s, idx) => {
                const player = playerMap[s.playerId];
                return (
                  <li key={s.playerId + idx} style={{ color: "#B71C1C", fontWeight: 600 }}>
                    {player ? `${player.firstName} ${player.lastName}` : s.playerId}
                    {" — "}
                    <b>{s.driveCapacity !== undefined ? s.driveCapacity : 0}</b> seat(s)
                  </li>
                );
              })
            )}
          </ul>
        </div>
        {/* Riders */}
        <div className="col-md-6 mb-2">
          <h4 style={{ color: "#DF2E38", fontWeight: 700 }}>Needs A Ride</h4>
          <ul style={{ fontSize: 17 }}>
            {riders.length === 0 ? (
              <li className="text-muted">No riders yet!</li>
            ) : (
              riders.map((s, idx) => {
                const player = playerMap[s.playerId];
                return (
                  <li key={s.playerId + idx} style={{ color: "#B71C1C", fontWeight: 600 }}>
                    {player ? `${player.firstName} ${player.lastName}` : s.playerId}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
