import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query, addDoc } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";

type Tournament = {
  id: string;
  eventName: string;
  date: string;
};

type Signup = {
  id: string;            // signup doc id!
  playerId: string;      // player doc id
  firstName: string;
  lastName: string;
  availability: string;
  startTime?: string;
  endTime?: string;
};

type Team = {
  name: string;
  players: {
    player: Signup;
    isCaptain: boolean;
  }[];
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const TeamManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [eligiblePlayers, setEligiblePlayers] = useState<Signup[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load tournaments from Firestore
  useEffect(() => {
    const fetchTournaments = async () => {
      const qTourn = query(collection(db, "tournaments"), orderBy("date"));
      const tournSnap = await getDocs(qTourn);
      const today = new Date();
      const allTourns: Tournament[] = tournSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((t) => t.date && new Date(t.date) >= today);
      setTournaments(allTourns);
    };
    fetchTournaments();
  }, []);

  // Fetch eligible players for selected tournament
  useEffect(() => {
    const fetchEligiblePlayers = async () => {
      if (!selectedTournament) return setEligiblePlayers([]);
      setLoading(true);
      const entriesRef = collection(db, "signups", selectedTournament, "entries");
      const entriesSnap = await getDocs(entriesRef);
      const signups: Signup[] = [];
      for (const docSnap of entriesSnap.docs) {
        const data = docSnap.data();
        // Only allow attending (not "no")
        if (data.availability !== "no" && data.playerId) {
          // Fetch player info
          const playerDoc = await getDoc(doc(db, "players", data.playerId));
          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            signups.push({
              id: docSnap.id,
              playerId: data.playerId,
              firstName: playerData.firstName || "",
              lastName: playerData.lastName || "",
              availability: data.availability,
              startTime: data.startTime,
              endTime: data.endTime,
            });
          }
        }
      }
      // Sort alphabetically by name
      signups.sort((a, b) => a.lastName.localeCompare(b.lastName));
      setEligiblePlayers(signups);
      setTeams([]); // Reset teams when switching tournaments
      setLoading(false);

      // Debug: log eligible
      console.log("Eligible Players for", selectedTournament, signups);
    };
    fetchEligiblePlayers();
  }, [selectedTournament]);

  // Add new team (A, B, ...)
  const handleAddTeam = () => {
    if (teams.length >= alphabet.length) return;
    setTeams((prev) => [
      ...prev,
      { name: `Team ${alphabet[prev.length]}`, players: [] }
    ]);
  };

  // Remove last team
  const handleDeleteTeam = () => {
    setTeams((prev) => prev.slice(0, -1));
  };

  // Add player to a team
  const handleAddPlayer = (teamIdx: number, player: Signup) => {
    // Prevent player in multiple teams
    if (teams.some((team) => team.players.some(p => p.player.playerId === player.playerId)))
      return;
    setTeams((prev) =>
      prev.map((team, idx) =>
        idx === teamIdx
          ? { ...team, players: [...team.players, { player, isCaptain: false }] }
          : team
      )
    );
  };

  // Remove player from a team
  const handleRemovePlayer = (teamIdx: number, playerId: string) => {
    setTeams((prev) => {
      const updated = [...prev];
      updated[teamIdx].players = updated[teamIdx].players.filter(p => p.player.playerId !== playerId);
      return updated;
    });
  };

  // Toggle captain
  const handleToggleCaptain = (teamIdx: number, playerId: string) => {
    setTeams((prev) => {
      const updated = [...prev];
      updated[teamIdx].players = updated[teamIdx].players.map(p =>
        p.player.playerId === playerId ? { ...p, isCaptain: !p.isCaptain } : p
      );
      return updated;
    });
  };

  // List of players not yet assigned to any team
  const unassignedPlayers = eligiblePlayers.filter(
    ep => !teams.some(team => team.players.some(tp => tp.player.playerId === ep.playerId))
  );

  // Save teams to Firestore
  const handleSaveTeams = async () => {
    if (!selectedTournament || teams.length === 0) return;
    setSaving(true);
    try {
      for (const team of teams) {
        await addDoc(collection(db, "teams"), {
          tournamentId: selectedTournament,
          name: team.name,
          players: team.players.map(p => ({
            signupId: p.player.id,      // The signup doc id
            isCaptain: p.isCaptain,
          })),
        });
      }
      alert("Teams saved to Firestore!");
    } catch (err: any) {
      alert("Error saving teams: " + (err?.message || err));
    }
    setSaving(false);
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Make Teams</h1>
      {/* Tournament Selection */}
      <div className="mb-4">
        <select
          className="form-select"
          value={selectedTournament}
          onChange={e => setSelectedTournament(e.target.value)}
        >
          <option value="">Select Tournament...</option>
          {tournaments.map(t => (
            <option value={t.id} key={t.id}>
              {t.eventName} {t.date ? `(${t.date})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 d-flex gap-2">
        <button
          className="btn btn-success"
          onClick={handleAddTeam}
          disabled={!selectedTournament || loading}
        >
          Add Team
        </button>
        <button
          className="btn btn-danger"
          onClick={handleDeleteTeam}
          disabled={teams.length === 0}
        >
          Delete Team
        </button>
        <button
          className="btn btn-primary ms-auto"
          onClick={handleSaveTeams}
          disabled={!selectedTournament || teams.length === 0 || saving}
        >
          {saving ? "Saving..." : "Save Teams"}
        </button>
      </div>

      {loading && <div>Loading eligible players...</div>}

      {!loading && selectedTournament && (
        <div className="row g-4">
          {teams.map((team, tIdx) => (
            <div className="col-md-6 col-lg-4" key={team.name}>
              <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span>{team.name}</span>
                  <div className="dropdown">
                    <button
                      className="btn btn-sm btn-outline-primary dropdown-toggle"
                      type="button"
                      id={`dropdown${tIdx}`}
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      disabled={unassignedPlayers.length === 0}
                    >
                      Add Player
                    </button>
                    <ul className="dropdown-menu" aria-labelledby={`dropdown${tIdx}`}>
                      {unassignedPlayers.map((user) => (
                        <li key={user.playerId}>
                          <button
                            className="dropdown-item"
                            onClick={() => handleAddPlayer(tIdx, user)}
                          >
                            {user.firstName} {user.lastName}
                            {" "}
                            <span className="badge bg-info ms-2">
                              {user.availability === "yes" && "Attending"}
                              {user.availability === "early" && `Leaving Early${user.endTime ? `: ${user.endTime}` : ""}`}
                              {user.availability === "late" && `Arriving Late${user.startTime ? `: ${user.startTime}` : ""}`}
                              {user.availability === "late_early" && `Late & Early (${user.startTime || "?"} - ${user.endTime || "?"})`}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <ul className="list-group list-group-flush">
                  {team.players.map(({ player, isCaptain }) => (
                    <li key={player.playerId} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>
                          {player.firstName} {player.lastName}
                        </strong>
                        <span style={{ fontSize: 12, marginLeft: 8 }}>
                          {player.availability === "early" && ` (Leaving Early${player.endTime ? `: ${player.endTime}` : ""})`}
                          {player.availability === "late" && ` (Arriving Late${player.startTime ? `: ${player.startTime}` : ""})`}
                          {player.availability === "late_early" && ` (Late & Early: ${player.startTime || "?"} - ${player.endTime || "?"})`}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <label className="me-2 mb-0">
                          <input
                            type="checkbox"
                            checked={isCaptain}
                            onChange={() => handleToggleCaptain(tIdx, player.playerId)}
                            style={{ marginRight: 4 }}
                          />
                          Captain?
                        </label>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemovePlayer(tIdx, player.playerId)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Optionally: Show unassigned players */}
      {!loading && selectedTournament && teams.length > 0 && unassignedPlayers.length > 0 && (
        <div className="mt-4">
          <h5>Unassigned Players</h5>
          <ul>
            {unassignedPlayers.map(p => (
              <li key={p.playerId}>{p.firstName} {p.lastName}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
