import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";

type Tournament = {
  id: string;
  eventName: string;
  date: string;
};

type Signup = {
  id: string;
  playerId: string;
  firstName: string;
  lastName: string;
  availability: string;
  startTime?: string;
  endTime?: string;
};

type Team = {
  id?: string;
  name: string;
  players: {
    signupId: string;
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
  const [activeAddTeamIdx, setActiveAddTeamIdx] = useState<number | null>(null);

  // Load tournaments
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

  // Load eligible players and autofill teams
  useEffect(() => {
    const fetchEligiblePlayersAndTeams = async () => {
      if (!selectedTournament) {
        setEligiblePlayers([]);
        setTeams([]);
        return;
      }
      setLoading(true);

      // Eligible players
      const entriesRef = collection(
        db,
        "signups",
        selectedTournament,
        "entries"
      );
      const entriesSnap = await getDocs(entriesRef);
      const signups: Signup[] = [];
      for (const docSnap of entriesSnap.docs) {
        const data = docSnap.data();
        if (data.availability !== "no" && data.playerId) {
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
      signups.sort((a, b) => a.lastName.localeCompare(b.lastName));
      setEligiblePlayers(signups);

      // Fetch teams from subcollection
      const teamsCol = collection(
        db,
        "tournaments",
        selectedTournament,
        "teams"
      );
      const teamsSnap = await getDocs(teamsCol);
      if (!teamsSnap.empty) {
        setTeams(
          teamsSnap.docs.map((docu) => ({
            id: docu.id,
            ...docu.data(),
          })) as Team[]
        );
      } else {
        setTeams([]);
      }

      setLoading(false);
    };
    fetchEligiblePlayersAndTeams();
  }, [selectedTournament]);

  // Add new team (A, B, ...)
  const handleAddTeam = () => {
    if (teams.length >= alphabet.length) return;
    setTeams((prev) => [
      ...prev,
      { name: `Team ${alphabet[prev.length]}`, players: [] },
    ]);
  };

  // Remove last team (not from Firestore until save)
  const handleDeleteTeam = () => {
    setTeams((prev) => prev.slice(0, -1));
  };

  // Add player to a team
  const handleAddPlayer = (teamIdx: number, player: Signup) => {
    if (
      teams.some((team) => team.players.some((p) => p.signupId === player.id))
    )
      return;
    setTeams((prev) =>
      prev.map((team, idx) =>
        idx === teamIdx
          ? {
              ...team,
              players: [
                ...team.players,
                { signupId: player.id, isCaptain: false },
              ],
            }
          : team
      )
    );
    setActiveAddTeamIdx(null);
  };

  // Remove player from a team
  const handleRemovePlayer = (teamIdx: number, signupId: string) => {
    setTeams((prev) => {
      const updated = [...prev];
      updated[teamIdx].players = updated[teamIdx].players.filter(
        (p) => p.signupId !== signupId
      );
      return updated;
    });
  };

  // Set the only captain (radio style)
  const handleSetCaptain = (teamIdx: number, signupId: string) => {
    setTeams((prev) => {
      const updated = [...prev];
      updated[teamIdx].players = updated[teamIdx].players.map((p) => ({
        ...p,
        isCaptain: p.signupId === signupId,
      }));
      return updated;
    });
  };

  // List of players not yet assigned to any team
  const unassignedPlayers = eligiblePlayers.filter(
    (ep) =>
      !teams.some((team) => team.players.some((tp) => tp.signupId === ep.id))
  );

  // Save teams (WIPES existing and re-creates all for this tournament)
  const handleSaveTeams = async () => {
    if (!selectedTournament || teams.length === 0) return;
    setSaving(true);
    try {
      const teamsColRef = collection(
        db,
        "tournaments",
        selectedTournament,
        "teams"
      );
      const existing = await getDocs(teamsColRef);
      for (const docu of existing.docs) await deleteDoc(docu.ref);
      for (const team of teams) {
        await addDoc(teamsColRef, {
          name: team.name,
          players: team.players.map((p) => ({
            signupId: p.signupId,
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

  // For display: join team player signupId with eligiblePlayers to get names
  const expandedTeams = teams.map((team) => ({
    id: team.id || "",
    name: team.name,
    players: team.players.map((member) => {
      const found = eligiblePlayers.find((ep) => ep.id === member.signupId);
      return {
        signupId: member.signupId,
        isCaptain: member.isCaptain,
        firstName: found?.firstName || "Unknown",
        lastName: found?.lastName || "",
        playerId: found?.playerId || "",
        availability: found?.availability,
        startTime: found?.startTime,
        endTime: found?.endTime,
      };
    }),
  }));

  return (
    <div className="container py-4" style={{ minHeight: 600 }}>
      <h1 className="text-center mb-4" style={{ color: "#2155CD", fontWeight: 800 }}>
        Make Teams
      </h1>
      {/* Tournament Selection */}
      <div className="mb-4 d-flex align-items-center gap-2">
        <select
          className="form-select"
          style={{ maxWidth: 400 }}
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
        >
          <option value="">Select Tournament...</option>
          {tournaments.map((t) => (
            <option value={t.id} key={t.id}>
              {t.eventName} {t.date ? `(${t.date})` : ""}
            </option>
          ))}
        </select>
        <button
          className="btn btn-success"
          onClick={handleAddTeam}
          disabled={!selectedTournament || loading}
        >
          <i className="bi bi-plus-lg"></i> Add Team
        </button>
        <button
          className="btn btn-danger"
          onClick={handleDeleteTeam}
          disabled={teams.length === 0}
        >
          <i className="bi bi-trash"></i> Delete Team
        </button>
        <button
          className="btn btn-primary ms-auto"
          onClick={handleSaveTeams}
          disabled={!selectedTournament || teams.length === 0 || saving}
        >
          {saving ? "Saving..." : <><i className="bi bi-save2"></i> Save Teams</>}
        </button>
      </div>

      {loading && <div>Loading eligible players & teams...</div>}

      {/* --- TEAM CARDS --- */}
      <div className="row g-4">
        {!loading &&
          selectedTournament &&
          expandedTeams.map((team, tIdx) => (
            <div className="col-md-6 col-lg-4" key={team.name}>
              <div
                className="card shadow"
                style={{
                  borderRadius: 16,
                  border: "none",
                  background: "linear-gradient(90deg, #e0ecff 0%, #e8ffe6 100%)",
                }}
              >
                <div className="card-header d-flex justify-content-between align-items-center bg-white" style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                  <span style={{ fontWeight: 600, fontSize: 18, color: "#2155CD" }}>
                    <i className="bi bi-people-fill me-2"></i>{team.name}
                  </span>
                  <button
                    className="btn btn-outline-success btn-sm px-2"
                    style={{ borderRadius: 14 }}
                    onClick={() => setActiveAddTeamIdx(tIdx)}
                    disabled={unassignedPlayers.length === 0}
                  >
                    <i className="bi bi-person-plus-fill"></i> Add
                  </button>
                </div>
                <ul className="list-group list-group-flush">
                  {team.players.length === 0 && (
                    <li className="list-group-item text-center text-secondary py-4">
                      <em>No players yet!</em>
                    </li>
                  )}
                  {team.players.map(
                    ({ signupId, isCaptain }, idx) => {
                      const full = eligiblePlayers.find(
                        (ep) => ep.id === signupId
                      );
                      return (
                        <li
                          key={signupId}
                          className="list-group-item d-flex justify-content-between align-items-center"
                          style={{ background: isCaptain ? "#f5f9ff" : "" }}
                        >
                          <div className="d-flex align-items-center">
                            {/* Radial toggle for Captain */}
                            <input
                              type="radio"
                              name={`captain-team-${tIdx}`}
                              checked={isCaptain}
                              onChange={() => handleSetCaptain(tIdx, signupId)}
                              style={{
                                accentColor: "#2155CD",
                                marginRight: 8,
                                width: 18,
                                height: 18,
                                cursor: "pointer",
                              }}
                            />
                            <span
                              className="fw-bold"
                              style={{
                                color: "#2e3a59",
                                fontWeight: 700,
                                fontSize: 16,
                              }}
                            >
                              {full
                                ? `${full.firstName} ${full.lastName}`
                                : "Unknown"}
                            </span>
                            {isCaptain && (
                              <span
                                className="badge bg-primary ms-2"
                                style={{
                                  borderRadius: "12px",
                                  fontSize: "0.85em",
                                  verticalAlign: "middle",
                                }}
                              >
                                Captain
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: 13,
                                marginLeft: 10,
                                color: "#458",
                              }}
                            >
                              {full?.availability === "early" &&
                                ` (Leaving Early${full.endTime ? `: ${full.endTime}` : ""})`}
                              {full?.availability === "late" &&
                                ` (Arriving Late${full.startTime ? `: ${full.startTime}` : ""})`}
                              {full?.availability === "late_early" &&
                                ` (Late & Early: ${full.startTime || "?"} - ${full.endTime || "?"})`}
                            </span>
                          </div>
                          {/* X for Remove */}
                          <button
                            className="btn btn-link text-danger"
                            onClick={() => handleRemovePlayer(tIdx, signupId)}
                            style={{
                              fontSize: 21,
                              fontWeight: 900,
                              padding: 0,
                              marginLeft: 10,
                              lineHeight: "1",
                              border: "none",
                              background: "none",
                              outline: "none",
                              boxShadow: "none",
                              textDecoration: "none",
                            }}
                            title="Remove player"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </li>
                      );
                    }
                  )}
                </ul>
              </div>
            </div>
          ))}
      </div>

      {/* --- ADD PLAYER MODAL --- */}
      {activeAddTeamIdx !== null && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "#0005" }}
          tabIndex={-1}
          role="dialog"
          onClick={() => setActiveAddTeamIdx(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Add Player to {expandedTeams[activeAddTeamIdx].name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveAddTeamIdx(null)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {unassignedPlayers.length === 0 ? (
                  <div className="text-secondary">No unassigned players.</div>
                ) : (
                  <ul className="list-group">
                    {unassignedPlayers.map((user) => (
                      <li
                        className="list-group-item d-flex justify-content-between align-items-center"
                        key={user.playerId}
                      >
                        <span>
                          <i className="bi bi-person me-2"></i>
                          {user.firstName} {user.lastName}{" "}
                          <span className="badge bg-info ms-2">
                            {user.availability === "yes" && "Attending"}
                            {user.availability === "early" &&
                              `Leaving Early${user.endTime ? `: ${user.endTime}` : ""}`}
                            {user.availability === "late" &&
                              `Arriving Late${user.startTime ? `: ${user.startTime}` : ""}`}
                            {user.availability === "late_early" &&
                              `Late & Early (${user.startTime || "?"} - ${user.endTime || "?"})`}
                          </span>
                        </span>
                        <button
                          className="btn btn-success btn-sm"
                          style={{ borderRadius: 16 }}
                          onClick={() => handleAddPlayer(activeAddTeamIdx, user)}
                        >
                          <i className="bi bi-plus"></i> Add
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unassigned players */}
      {!loading && selectedTournament && teams.length > 0 && unassignedPlayers.length > 0 && (
        <div className="mt-4">
          <h5 style={{ color: "#2155CD" }}>Unassigned Players</h5>
          <ul>
            {unassignedPlayers.map((p) => (
              <li key={p.playerId}>
                <i className="bi bi-person me-2"></i>
                {p.firstName} {p.lastName}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
