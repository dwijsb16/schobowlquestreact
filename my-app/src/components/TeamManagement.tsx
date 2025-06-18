import React, { useEffect, useState } from "react";
import { getCollection } from "../hooks/firestore";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  grade: string;
  email: string;
}

interface Team {
  name: string;
  players: string[];
}

const TeamManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const teams: Team[] = [
    { name: "Team A", players: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"] },
    { name: "Team B", players: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"] },
    { name: "Team C", players: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"] },
  ];

  const tournaments = ["Jr. Wildcat", "IESA State (5/)", "MSNCT (5/)"];

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getCollection<User>("players");
      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, []);

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Make Teams:</h1>

      <div className="d-flex align-items-center mb-4 gap-2">
        <div className="dropdown me-2">
          <button className="btn btn-outline-primary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
            Select Event
          </button>
          <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
            {tournaments.map((tournament, index) => (
              <li key={index}><button className="dropdown-item">{tournament}</button></li>
            ))}
          </ul>
        </div>

        <button id="addTeamBtn" className="btn btn-success">Add Team</button>
        <button id="delTeamBtn" className="btn btn-danger">Delete Team</button>
      </div>

      <div className="row g-4">
        {teams.map((team, index) => (
          <div className="col-md-6 col-lg-4" key={index}>
            <div className="card shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>{team.name}</span>
                <div className="dropdown">
                  <button className="btn btn-sm btn-outline-danger dropdown-toggle" type="button" id={`dropdown${index}`} data-bs-toggle="dropdown" aria-expanded="false">
                    Select Player
                  </button>
                  <ul className="dropdown-menu" aria-labelledby={`dropdown${index}`}>
                    {users.map((user) => (
                      <li key={user.id}>
                        <button className="dropdown-item">
                          {user.firstName} {user.lastName}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <ul className="list-group list-group-flush">
                {team.players.map((player, playerIndex) => (
                  <li key={playerIndex} className="list-group-item d-flex justify-content-between align-items-center">
                    {player}
                    <button className="btn btn-sm btn-outline-danger">Delete</button>
                  </li>
                ))}
              </ul>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamManagement;
