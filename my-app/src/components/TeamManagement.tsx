import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  addDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { isTodayOrLater } from "../utils/date";

// --- SVG Crown for Captain Badge ---
const Crown = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M2 6l3.5 6 3.5-8 3.5 8 3.5-6"
      stroke="#DF2E38"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="3" y="13.7" width="12" height="2.1" rx="1" fill="#DF2E38" />
  </svg>
);

// --- Inline red X icon (no external CSS needed) ---
const XIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#DF2E38" aria-hidden="true">
    <path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zm-3.54 5.46 2.54 2.54 2.54-2.54 1.42 1.42L12.42 10.9l2.54 2.54-1.42 1.42-2.54-2.54-2.54 2.54-1.42-1.42 2.54-2.54-2.54-2.54 1.42-1.42z" />
  </svg>
);

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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
  isCoach?: boolean;
};

type Team = {
  id?: string;
  name: string;
  players: {
    signupId: string;
    isCaptain: boolean; // stays the same in DB even if we display "Co-Captain"
    isCoach?: boolean; // true when the member came from coach_signups
  }[];
};

const TeamManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [eligiblePlayers, setEligiblePlayers] = useState<Signup[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeAddTeamIdx, setActiveAddTeamIdx] = useState<number | null>(null);
  const [addTab, setAddTab] = useState<"player" | "coach">("player");
  const [publishTeams, setPublishTeams] = useState(false);

  // captains management modal (index of team or null)
  const [captainsModalIdx, setCaptainsModalIdx] = useState<number | null>(null);

  // ---- helpers for chips in unassigned list ----
  type Chip = { text: string; bg: string; color: string };
  const chip = (text: string, bg: string, color: string): Chip => ({ text, bg, color });

  function chipsForSignup(s: { availability?: string; startTime?: string; endTime?: string }): Chip[] {
    const avail = (s.availability || "").toLowerCase();
    const time = (t?: string) => (t ? t.slice(0, 5) : ""); // "HH:MM"
    switch (avail) {
      case "yes":
        return [chip("Attending", "#e6fff4", "#047857")]; // green
      case "no":
        return [chip("Not Attending", "#fde8e8", "#991b1b")]; // red
      case "early":
        return [chip(`Leaving early @ ${time(s.endTime)}`, "#fff7e6", "#92400e")]; // orange
      case "late":
        return [chip(`Arriving late @ ${time(s.startTime)}`, "#f0f9ff", "#075985")]; // blue
      case "late_early":
        return [
          chip(`Arriving @ ${time(s.startTime)}`, "#f0f9ff", "#075985"), // blue
          chip(`Leaving @ ${time(s.endTime)}`, "#fff7e6", "#92400e"), // orange
        ];
      default:
        return [chip("No response", "#eef2f7", "#334155")]; // gray
    }
  }

  // =========================
  // Load tournaments
  // =========================
  useEffect(() => {
    const fetchTournaments = async () => {
      const qTourn = query(collection(db, "tournaments"), orderBy("date"));
      const tournSnap = await getDocs(qTourn);
      const allTourns: Tournament[] = tournSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((t) => isTodayOrLater(t.date));

      setTournaments(allTourns);

      if (allTourns.length > 0) {
        setSelectedTournament(allTourns[0].id);
        // seed checkbox from Firestore tournament-level flag
        setPublishTeams(!!(allTourns[0] as any).teamsPublished);
      }
    };

    fetchTournaments();
  }, []);

  // =========================
  // Load eligible players + teams for selected tournament
  // =========================
  useEffect(() => {
    const fetchEligiblePlayersAndTeams = async () => {
      if (!selectedTournament) {
        setEligiblePlayers([]);
        setTeams([]);
        return;
      }

      setLoading(true);

      // Eligible players
      const entriesRef = collection(db, "signups", selectedTournament, "entries");
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

      // Eligible coaches (coach_signups reference users/{uid})
      const coachSnap = await getDocs(collection(db, "coach_signups", selectedTournament, "entries"));
      const coaches: Signup[] = [];
      for (const docSnap of coachSnap.docs) {
        const data = docSnap.data();
        const uid = data.userId || data.playerId;
        if (data.availability !== "no" && uid) {
          const userDoc = await getDoc(doc(db, "users", uid));
          const userData: any = userDoc.exists() ? userDoc.data() : {};
          coaches.push({
            id: docSnap.id,
            playerId: uid,
            firstName: userData.firstName || userData.displayName || "Coach",
            lastName: userData.lastName || "",
            availability: data.availability,
            startTime: data.startTime,
            endTime: data.endTime,
            isCoach: true,
          });
        }
      }
      coaches.sort((a, b) => a.lastName.localeCompare(b.lastName));

      setEligiblePlayers([...coaches, ...signups]);

      // Teams from subcollection
      const teamsCol = collection(db, "tournaments", selectedTournament, "teams");
      const teamsSnap = await getDocs(teamsCol);

      if (!teamsSnap.empty) {
        setTeams(
          teamsSnap.docs.map((docu) => ({
            id: docu.id,
            ...(docu.data() as any),
          })) as Team[]
        );
      } else {
        setTeams([]);
      }

      setLoading(false);
    };

    fetchEligiblePlayersAndTeams();
  }, [selectedTournament]);

  // =========================
  // Keep publishTeams in sync with tournament doc when switching tournaments
  // (Publishing should NOT lock editing; this only reflects visibility state.)
  // =========================
  useEffect(() => {
    const syncPublish = async () => {
      if (!selectedTournament) {
        setPublishTeams(false);
        return;
      }
      try {
        const tDoc = await getDoc(doc(db, "tournaments", selectedTournament));
        if (tDoc.exists()) {
          const data = tDoc.data() as any;
          setPublishTeams(!!data?.teamsPublished);
        } else {
          setPublishTeams(false);
        }
      } catch {
        // if it fails, leave whatever is currently shown
      }
    };

    syncPublish();
  }, [selectedTournament]);

  // =========================
  // Team operations
  // =========================
  const handleAddTeam = () => {
    if (teams.length >= alphabet.length) return;
    setTeams((prev) => [...prev, { name: `Team ${alphabet[prev.length]}`, players: [] }]);
  };

  const handleDeleteTeam = () => {
    setTeams((prev) => prev.slice(0, -1));
  };

  const setCaptainChecked = (teamIdx: number, signupId: string, checked: boolean) => {
    setTeams((prev) => {
      const copy = [...prev];
      copy[teamIdx].players = copy[teamIdx].players.map((p) =>
        p.signupId === signupId ? { ...p, isCaptain: checked } : p
      );
      return copy;
    });
  };

  const handleAddPlayer = (teamIdx: number, player: Signup) => {
    if (teams.some((team) => team.players.some((p) => p.signupId === player.id))) return;

    setTeams((prev) =>
      prev.map((team, idx) =>
        idx === teamIdx
          ? {
              ...team,
              players: [
                ...team.players,
                { signupId: player.id, isCaptain: false, ...(player.isCoach ? { isCoach: true } : {}) },
              ],
            }
          : team
      )
    );

    setActiveAddTeamIdx(null);
  };

  const handleRemovePlayer = (teamIdx: number, signupId: string) => {
    setTeams((prev) => {
      const updated = [...prev];
      updated[teamIdx].players = updated[teamIdx].players.filter((p) => p.signupId !== signupId);
      return updated;
    });
  };

  // Signups not yet assigned to any team, split into separate player and coach pools
  const unassigned = useMemo(
    () =>
      eligiblePlayers.filter(
        (ep) => !teams.some((team) => team.players.some((tp) => tp.signupId === ep.id))
      ),
    [eligiblePlayers, teams]
  );
  const unassignedPlayers = useMemo(() => unassigned.filter((u) => !u.isCoach), [unassigned]);
  const unassignedCoaches = useMemo(() => unassigned.filter((u) => u.isCoach), [unassigned]);

  const isCoachSignup = (signupId: string) =>
    !!eligiblePlayers.find((ep) => ep.id === signupId)?.isCoach;

  // Save teams (WIPES existing and re-creates all for this tournament)
  // IMPORTANT: publish should NOT lock editing; this just sets visibility flags in Firestore.
  const handleSaveTeams = async () => {
    if (!selectedTournament) return;
    setSaving(true);

    try {
      const teamsColRef = collection(db, "tournaments", selectedTournament, "teams");

      // Wipe existing teams in Firestore
      const existing = await getDocs(teamsColRef);
      for (const docu of existing.docs) await deleteDoc(docu.ref);

      // Re-create teams (if any)
      for (const team of teams) {
        await addDoc(teamsColRef, {
          name: team.name,
          published: publishTeams, // keep per-team flag if you want it
          players: team.players.map((p) => ({
            signupId: p.signupId,
            isCaptain: p.isCaptain, // ✅ DB stays the same
            ...(isCoachSignup(p.signupId) ? { isCoach: true } : {}),
          })),
        });
      }

      // Tournament-level publish flag: only true if checkbox true AND there is at least 1 team
      const publishFlag = publishTeams && teams.length > 0;
      await updateDoc(doc(db, "tournaments", selectedTournament), {
        teamsPublished: publishFlag,
      });

      alert(teams.length === 0 ? "All teams cleared!" : "Teams saved to Firestore!");
    } catch (err: any) {
      alert("Error saving teams: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Expanded display teams: join team player signupId with eligiblePlayers to get names
  const expandedTeams = useMemo(
    () =>
      teams.map((team) => ({
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
            isCoach: !!found?.isCoach,
            availability: found?.availability,
            startTime: found?.startTime,
            endTime: found?.endTime,
          };
        }),
      })),
    [teams, eligiblePlayers]
  );

  // Count captains per team for UI labeling ("Captain" vs "Co-Captain")
  const captainCountsByTeamIdx = useMemo(
    () => teams.map((t) => t.players.filter((p) => p.isCaptain).length),
    [teams]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f7f9fb",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div className="container py-4" style={{ maxWidth: 1050, width: "100%" }}>
          <h1
            className="text-center mb-4"
            style={{ color: "#DF2E38", fontWeight: 800, letterSpacing: 0.6 }}
          >
            Team Management
          </h1>

          {/* Tournament Selection */}
          <div className="mb-4 d-flex align-items-center gap-2 flex-wrap justify-content-center">
            <select
              className="form-select"
              style={{ maxWidth: 370, minWidth: 200, borderRadius: 13, fontWeight: 600 }}
              value={selectedTournament}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedTournament(id);
                const t = tournaments.find((tt) => tt.id === id);
                setPublishTeams(!!(t as any)?.teamsPublished);
              }}
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
              style={{ borderRadius: 13, fontWeight: 700 }}
              onClick={handleAddTeam}
              disabled={!selectedTournament || loading}
            >
              <i className="bi bi-plus-lg"></i> Add Team
            </button>

            <button
              className="btn btn-danger"
              style={{ borderRadius: 13, fontWeight: 700 }}
              onClick={handleDeleteTeam}
              disabled={teams.length === 0}
            >
              <i className="bi bi-trash"></i> Delete Team
            </button>

            <div className="form-check ms-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="publishTeams"
                checked={publishTeams}
                onChange={(e) => setPublishTeams(e.target.checked)}
                disabled={!selectedTournament || loading || saving}
              />
              <label className="form-check-label" htmlFor="publishTeams" style={{ fontWeight: 700 }}>
                Publish Teams
              </label>
            </div>

            <button
              className="btn btn-primary ms-auto"
              style={{ borderRadius: 13, fontWeight: 700, background: "#2155CD", border: "none" }}
              onClick={handleSaveTeams}
              disabled={!selectedTournament || saving}
            >
              {saving ? "Saving..." : <><i className="bi bi-save2"></i> Save Teams</>}
            </button>
          </div>

          {loading && <div className="text-center mt-4 mb-4">Loading eligible players & teams...</div>}

          {/* --- TEAM CARDS --- */}
          <div className="row g-4 justify-content-center">
            {!loading &&
              selectedTournament &&
              expandedTeams.map((team, tIdx) => {
                const captainCount = captainCountsByTeamIdx[tIdx] || 0;

                return (
                  <div className="col-md-6 col-lg-4" key={team.name}>
                    <div
                      className="card shadow"
                      style={{
                        borderRadius: 18,
                        border: "none",
                        background: "#fff",
                        boxShadow: "0 4px 26px #df2e380f",
                      }}
                    >
                      <div
                        className="card-header d-flex justify-content-between align-items-center bg-white"
                        style={{
                          borderTopLeftRadius: 18,
                          borderTopRightRadius: 18,
                          border: "none",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 19,
                            color: "#2155CD",
                            letterSpacing: 0.5,
                          }}
                        >
                          <i className="bi bi-people-fill me-2"></i>
                          {team.name}
                        </span>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline-secondary btn-sm px-2"
                            style={{ borderRadius: 13, fontWeight: 600 }}
                            onClick={() => setCaptainsModalIdx(tIdx)}
                            disabled={team.players.length === 0}
                            title="Manage captains"
                          >
                            Manage Captains
                          </button>

                          <button
                            className="btn btn-outline-success btn-sm px-2"
                            style={{ borderRadius: 13, fontWeight: 600 }}
                            onClick={() => {
                              setAddTab(unassignedPlayers.length > 0 ? "player" : "coach");
                              setActiveAddTeamIdx(tIdx);
                            }}
                            disabled={unassigned.length === 0}
                          >
                            <i className="bi bi-person-plus-fill"></i> Add
                          </button>
                        </div>
                      </div>

                      <ul className="list-group list-group-flush">
                        {team.players.length === 0 && (
                          <li className="list-group-item text-center text-secondary py-4">
                            <em>No players or coaches yet!</em>
                          </li>
                        )}

                        {[...team.players]
                          .sort((a, b) => Number(isCoachSignup(b.signupId)) - Number(isCoachSignup(a.signupId)))
                          .map(({ signupId, isCaptain }) => {
                          const full = eligiblePlayers.find((ep) => ep.id === signupId);

                          return (
                            <li
                              key={signupId}
                              className="list-group-item d-flex justify-content-between align-items-center"
                              style={{
                                background: full?.isCoach ? "#eef4ff" : isCaptain ? "#fef3f4" : "#fafbfc",
                                border: "none",
                                borderRadius: 13,
                                marginBottom: 4,
                                position: "relative",
                              }}
                            >
                              <div
                                className="d-flex align-items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Left red X (remove) */}
                                <button
                                  type="button"
                                  className="btn btn-link p-0 me-2"
                                  onClick={() => handleRemovePlayer(tIdx, signupId)}
                                  title={full?.isCoach ? "Remove coach" : "Remove player"}
                                  aria-label={full?.isCoach ? "Remove coach" : "Remove player"}
                                  style={{
                                    color: "#DF2E38",
                                    textDecoration: "none",
                                    lineHeight: 0,
                                    pointerEvents: "auto",
                                    zIndex: 10,
                                  }}
                                >
                                  <XIcon />
                                </button>

                                {/* Name + badges */}
                                <span
                                  className="fw-bold"
                                  style={{ color: "#232323", fontWeight: 700, fontSize: 16 }}
                                >
                                  {full ? `${full.firstName} ${full.lastName}` : "Unknown"}
                                </span>
                                {full?.isCoach && (
                                  <span className="badge ms-2" style={{ background: "#2155CD", color: "#fff", borderRadius: 10, fontWeight: 600 }}>
                                    Coach
                                  </span>
                                )}

                                {/* ✅ UI label becomes Co-Captain if multiple captains in same team.
                                    ✅ DB stays isCaptain: true/false (no change). */}
                                {isCaptain && (
                                  <span
                                    className="badge ms-2"
                                    style={{
                                      borderRadius: "14px",
                                      background: "#fff0f0",
                                      color: "#DF2E38",
                                      fontWeight: 700,
                                      fontSize: "0.97em",
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Crown />
                                    <span className="ms-1">
                                      {captainCount > 1 ? "Co-Captain" : "Captain"}
                                    </span>
                                  </span>
                                )}

                                <span
                                  style={{
                                    fontSize: 13,
                                    marginLeft: 10,
                                    color: "#456",
                                    fontStyle: "italic",
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
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* --- ADD PLAYER MODAL --- */}
          {activeAddTeamIdx !== null && (
            <div
              className="modal fade show"
              style={{ display: "block", background: "#2e3a5960" }}
              tabIndex={-1}
              role="dialog"
              onClick={() => setActiveAddTeamIdx(null)}
            >
              <div
                className="modal-dialog modal-dialog-centered"
                role="document"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content" style={{ borderRadius: 18 }}>
                  <div
                    className="modal-header"
                    style={{
                      borderTopLeftRadius: 18,
                      borderTopRightRadius: 18,
                      background: "#2155CD",
                    }}
                  >
                    <h5 className="modal-title text-white" style={{ fontWeight: 800 }}>
                      Add to {expandedTeams[activeAddTeamIdx].name}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setActiveAddTeamIdx(null)}
                      aria-label="Close"
                    ></button>
                  </div>

                  <div
                    className="modal-body"
                    style={{ background: "#f8fbff", borderRadius: "0 0 18px 18px" }}
                  >
                    {/* Player / Coach tabs */}
                    <div className="btn-group w-100 mb-3" role="group" aria-label="Add a player or a coach">
                      {(["player", "coach"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          className={`btn ${addTab === tab ? "btn-primary" : "btn-outline-primary"}`}
                          style={{ fontWeight: 700 }}
                          onClick={() => setAddTab(tab)}
                        >
                          {tab === "player" ? "Players" : "Coaches"} (
                          {tab === "player" ? unassignedPlayers.length : unassignedCoaches.length})
                        </button>
                      ))}
                    </div>

                    {(addTab === "coach" ? unassignedCoaches : unassignedPlayers).length === 0 ? (
                      <div className="text-secondary">
                        {addTab === "coach" ? "No unassigned coaches." : "No unassigned players."}
                      </div>
                    ) : (
                      <ul className="list-group">
                        {(addTab === "coach" ? unassignedCoaches : unassignedPlayers).map((user) => (
                          <li
                            className="list-group-item d-flex justify-content-between align-items-center"
                            key={user.playerId}
                            style={{
                              background: "#fff",
                              border: "none",
                              borderRadius: 12,
                              marginBottom: 4,
                            }}
                          >
                            <span>
                              <i className="bi bi-person me-2" style={{ color: "#2155CD" }}></i>
                              {user.firstName} {user.lastName}{" "}
                              {user.isCoach && (
                                <span className="badge ms-1" style={{ background: "#2155CD", color: "#fff", fontWeight: 600 }}>
                                  Coach
                                </span>
                              )}
                              <span className="badge bg-info ms-2" style={{ fontWeight: 600 }}>
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
                              style={{ borderRadius: 14, fontWeight: 600 }}
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

          {/* --- MANAGE CAPTAINS MODAL --- */}
          {captainsModalIdx !== null && (
            <div
              className="modal fade show"
              style={{ display: "block", background: "#2e3a5960" }}
              tabIndex={-1}
              role="dialog"
              onClick={() => setCaptainsModalIdx(null)}
            >
              <div
                className="modal-dialog modal-dialog-centered"
                role="document"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content" style={{ borderRadius: 18 }}>
                  <div
                    className="modal-header"
                    style={{
                      borderTopLeftRadius: 18,
                      borderTopRightRadius: 18,
                      background: "#2155CD",
                    }}
                  >
                    <h5 className="modal-title text-white" style={{ fontWeight: 800 }}>
                      Manage Captains — {expandedTeams[captainsModalIdx].name}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setCaptainsModalIdx(null)}
                      aria-label="Close"
                    ></button>
                  </div>

                  <div
                    className="modal-body"
                    style={{ background: "#f8fbff", borderRadius: "0 0 18px 18px" }}
                  >
                    <ul className="list-group">
                      {expandedTeams[captainsModalIdx].players.filter((m) => !m.isCoach).length === 0 && (
                        <li className="list-group-item text-secondary" style={{ border: "none" }}>
                          No players in this team.
                        </li>
                      )}

                      {expandedTeams[captainsModalIdx].players.filter((m) => !m.isCoach).map((member) => {
                        const modalCaptainCount = captainCountsByTeamIdx[captainsModalIdx] || 0;

                        return (
                          <li
                            key={member.signupId}
                            className="list-group-item d-flex align-items-center justify-content-between"
                            style={{
                              border: "none",
                              background: "#fff",
                              borderRadius: 12,
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {member.firstName} {member.lastName}
                            </span>

                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id={`capt-${member.signupId}`}
                                checked={member.isCaptain}
                                onChange={(e) =>
                                  setCaptainChecked(captainsModalIdx, member.signupId, e.target.checked)
                                }
                              />
                              <label
                                className="form-check-label ms-2"
                                htmlFor={`capt-${member.signupId}`}
                                style={{ fontWeight: 600 }}
                              >
                                {member.isCaptain
                                  ? modalCaptainCount > 1
                                    ? "Co-Captain"
                                    : "Captain"
                                  : "Not Captain"}
                              </label>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-primary"
                      onClick={() => setCaptainsModalIdx(null)}
                      style={{ borderRadius: 12, fontWeight: 700 }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unassigned pools: players and coaches */}
          {!loading &&
            selectedTournament &&
            teams.length > 0 &&
            ([
              { title: "Unassigned Players", items: unassignedPlayers, icon: "bi-person" },
              { title: "Unassigned Coaches", items: unassignedCoaches, icon: "bi-person-badge" },
            ] as const).map(
              (pool) =>
                pool.items.length > 0 && (
                  <div className="mt-4" key={pool.title}>
                    <h5 style={{ color: "#2155CD", fontWeight: 700 }}>{pool.title}</h5>
                    <ul style={{ listStyle: "none", paddingLeft: 0, marginBottom: 0 }}>
                      {pool.items.map((p) => (
                        <li
                          key={p.id}
                          style={{
                            background: p.isCoach ? "#eef4ff" : "#fff",
                            borderRadius: 12,
                            padding: "8px 12px",
                            marginBottom: 6,
                            boxShadow: "0 1px 6px #0000000d",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <i className={`bi ${pool.icon}`} style={{ color: "#2155CD" }} />
                          <span style={{ fontWeight: 700 }}>
                            {p.firstName} {p.lastName}
                          </span>

                          {/* status chips */}
                          <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", marginLeft: 8 }}>
                            {chipsForSignup(p).map((c, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  background: c.bg,
                                  color: c.color,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {c.text}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )}
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
