import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {getDoc,doc,collection,addDoc,query,where,getDocs, updateDoc,serverTimestamp,} from "firebase/firestore";
import {onAuthStateChanged,getAuth,User as FirebaseUser,} from "firebase/auth";
import { db } from "../.firebase/utils/firebase";
import { Tournament } from "../types/event";
import { Player } from "../types/player";
import { Signup } from "../types/signup";
import emailjs from "emailjs-com";
import { useNavigate } from "react-router-dom";


const green = "#6BCB77";
const blue = "#2e3a59";
const TEMPLATE_ID = "template_lsh00qp";
const SERVICE_ID = "service_cfows1h";
const EMAIL_API_KEY = "GRAfhbyKXL9qsCDKk";

// Utility function to fetch all coaches' emails
async function getAllCoachEmails() {
  const coachesSnap = await getDocs(
    query(collection(db, "users"), where("role", "==", "coach"))
  );
  return coachesSnap.docs.map((doc) => doc.data().email).filter(Boolean);
}

export async function sendSignupNotification({
  playerName,
  tournamentName,
  editorEmail,
  timestamp,
  actionType,
  toEmail, // <--- singular
  bccList,
  availability,
  startTime,
  endTime,
  carpool,
  driveCapacity,
  parentAttending,
  canModerate,
  canScorekeep,
  additionalInfo,
  allInfo,
}: {
  playerName: string;
  tournamentName: string;
  editorEmail: string;
  timestamp: any;
  actionType: string;
  toEmail: string; // <--- singular
  bccList: string;
  availability: string;
  startTime: string;
  endTime: string;
  carpool: string;
  driveCapacity: string;
  parentAttending: string;
  canModerate: string;
  canScorekeep: string;
  additionalInfo: string;
  allInfo: string;
}) {
  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      player_name: playerName,
      tournament_name: tournamentName,
      editor_email: editorEmail,
      timestamp,
      action_type: actionType,
      to_email: toEmail,
      bcc_list: bccList,
      availability,
      start_time: startTime,
      end_time: endTime,
      carpool,
      drive_capacity: driveCapacity,
      parent_attending: parentAttending,
      can_moderate: canModerate,
      can_scorekeep: canScorekeep,
      additional_info: additionalInfo,
      all_info: allInfo,
    },
    EMAIL_API_KEY
  );
}

type TeamDoc = {
  id: string;
  name: string;
  players: {
    signupId: string; // references signup doc in signups/{tournamentId}/entries
    isCaptain: boolean;
  }[];
};

type SignupDoc = Signup & {
  id: string;
};

type PlayerMap = Record<string, Player>;

const TournamentPage: React.FC = () => {
  const { id: tournamentId } = useParams();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [linkedPlayers, setLinkedPlayers] = useState<Player[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const navigate = useNavigate();

  // --- Registration Form State ---
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [availability, setAvailability] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [carpool, setCarpool] = useState<string[]>([]);
  const [driveCapacity, setDriveCapacity] = useState("");
  const [parentAttending, setParentAttending] = useState(false);
  const [canModerate, setCanModerate] = useState(false);
  const [canScorekeep, setCanScorekeep] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- Team, Signup, Player Data ---
  const [teams, setTeams] = useState<TeamDoc[]>([]);
  const [signups, setSignups] = useState<SignupDoc[]>([]);
  const [playerMap, setPlayerMap] = useState<PlayerMap>({});
  const [existingSignupDocId, setExistingSignupDocId] = useState<string | null>(null);
  const [fetchingSignup, setFetchingSignup] = useState(false);

  const showStartTime = availability === "late" || availability === "late_early";
  const showEndTime = availability === "early" || availability === "late_early";
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLinkedPlayers([]);
      setLoadingPlayers(true);
  
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.role === "player") {
            // They're a player, just use themselves
            const playerDoc = await getDoc(doc(db, "players", user.uid));
            if (playerDoc.exists()) {
              setLinkedPlayers([{ ...(playerDoc.data() as Player), uid: user.uid }]);
              setSelectedPlayer(user.uid); // autofill!
            }
          } else {
            // Otherwise, use linkedPlayers as before (parent flow)
            const linkedPlayersUids: string[] = data.linkedPlayers || [];
            if (linkedPlayersUids.length) {
              const playerSnaps = await Promise.all(
                linkedPlayersUids.map((pid) => getDoc(doc(db, "players", pid)))
              );
              setLinkedPlayers(
                playerSnaps
                  .filter((snap) => snap.exists())
                  .map((snap) => ({
                    ...(snap.data() as Player),
                    uid: snap.id,
                  }))
              );
            }
          }
        }
      }
      setLoadingPlayers(false);
    });
    return () => unsubscribe();
  }, []);
  

  // Tournament details
  useEffect(() => {
    if (!tournamentId) return;
    const fetchTournament = async () => {
      const docRef = doc(db, "tournaments", tournamentId);
      const snap = await getDoc(docRef);
      if (snap.exists()) setTournament(snap.data() as Tournament);
    };
    fetchTournament();
  }, [tournamentId]);

  // All signups (for teams, drivers, etc)
  useEffect(() => {
    if (!tournamentId) return;
    const fetchSignups = async () => {
      const entriesRef = collection(db, "signups", tournamentId, "entries");
      const snap = await getDocs(entriesRef);
      const all: SignupDoc[] = [];
      for (const docu of snap.docs) {
        all.push({ ...(docu.data() as Signup), id: docu.id });
      }
      setSignups(all);
    };
    fetchSignups();
  }, [tournamentId]);

  // All teams for this tournament
  useEffect(() => {
    if (!tournamentId) return;
    const fetchTeams = async () => {
      const teamsCol = collection(db, "tournaments", tournamentId, "teams");
      const teamsSnap = await getDocs(teamsCol);
      setTeams(
        teamsSnap.docs.map((docu) => ({
          id: docu.id,
          ...(docu.data() as any),
        }))
      );
    };
    fetchTeams();
  }, [tournamentId]);

  // Player info lookup for all team & signup playerIds
  useEffect(() => {
    // gather all unique playerIds from signups
    const allPlayerIds = new Set<string>();
    signups.forEach((s) => s.playerId && allPlayerIds.add(s.playerId));
    teams.forEach((team) =>
      team.players.forEach((p) => {
        // Find the signup object this references and get the playerId
        const signup = signups.find((s) => s.id === p.signupId);
        if (signup && signup.playerId) allPlayerIds.add(signup.playerId);
      })
    );
    if (allPlayerIds.size === 0) return;
    (async () => {
      const playerDocs = await Promise.all(
        Array.from(allPlayerIds).map((pid) =>
          getDoc(doc(db, "players", pid))
        )
      );
      const map: PlayerMap = {};
      playerDocs.forEach((psnap) => {
        if (psnap.exists()) {
          map[psnap.id] = { ...(psnap.data() as Player), uid: psnap.id };
        }
      });
      setPlayerMap(map);
    })();
  }, [signups, teams]);

  // Autofill registration form with previous signup


  useEffect(() => {
    if (!selectedPlayer || !tournamentId) {
      setExistingSignupDocId(null);
      setAvailability("");
      setCarpool([]);
      setParentAttending(false);
      setCanModerate(false);
      setCanScorekeep(false);
      setAdditionalInfo("");
      setStartTime("");
      setEndTime("");
      setDriveCapacity("");
      return;
    }
    setFetchingSignup(true);
    (async () => {
      const entriesRef = collection(db, "signups", tournamentId, "entries");
      const existingQ = query(entriesRef, where("playerId", "==", selectedPlayer));
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        const docData = existingSnap.docs[0].data();
        setExistingSignupDocId(existingSnap.docs[0].id);
        // Set form state from docData as you do now...
        setAvailability(docData.availability || "");
        setCarpool(docData.carpool || []);
        setParentAttending(!!docData.parentAttending);
        setCanModerate(!!docData.canModerate);
        setCanScorekeep(!!docData.canScorekeep);
        setAdditionalInfo(docData.additionalInfo || "");
        setStartTime(docData.startTime || "");
        setEndTime(docData.endTime || "");
        setDriveCapacity(docData.driveCapacity || "");
      } else {
        setExistingSignupDocId(null);
        // ...reset form fields...
        setAvailability("");
        setCarpool([]);
        setParentAttending(false);
        setCanModerate(false);
        setCanScorekeep(false);
        setAdditionalInfo("");
        setStartTime("");
        setEndTime("");
        setDriveCapacity("");
      }
      setFetchingSignup(false);
    })();
    // eslint-disable-next-line
  }, [selectedPlayer, tournamentId]);


  const handleSubmit = async () => {
    if (!selectedPlayer || !currentUser || !tournamentId) return;
    setSubmitting(true);
  
    // Build signup object
    const signup: Signup = {
      tournamentId: tournamentId as string,
      userId: currentUser.uid,
      playerId: selectedPlayer,
      availability,
      carpool,
      parentAttending,
      canModerate: parentAttending ? canModerate : false,
      canScorekeep: parentAttending ? canScorekeep : false,
      additionalInfo,
      timestamp: serverTimestamp(),
      ...(showStartTime && startTime ? { startTime } : {}),
      ...(showEndTime && endTime ? { endTime } : {}),
      ...(carpool.includes("can-drive") && driveCapacity ? { driveCapacity } : {}),
    };
  
    // Always check Firestore for this player/tournament signup
    const entriesRef = collection(db, "signups", tournamentId, "entries");
    const existingQ = query(
      entriesRef,
      where("playerId", "==", selectedPlayer)
    );
    const existingSnap = await getDocs(existingQ);
  
    if (!existingSnap.empty) {
      // EDIT MODE: update the existing signup doc (should only be one)
      const docRef = existingSnap.docs[0].ref;
      await updateDoc(docRef, {
        ...signup,
        hasEdited: true,
        lastEdited: serverTimestamp(),
      });
      alert("Signup updated!");
  
      // --- Send email ONLY on EDIT
      const coachEmailsArr = await getAllCoachEmails();
      const coachEmails = coachEmailsArr.join(",");
      const playerObj = linkedPlayers.find((p) => p.uid === selectedPlayer);
  
      await sendSignupNotification({
        playerName: playerObj
          ? `${playerObj.firstName} ${playerObj.lastName}`
          : "N/A",
        tournamentName: tournament?.eventName || "N/A",
        editorEmail: currentUser.email || "",
        timestamp: new Date().toLocaleString(),
        actionType: "Edit",
        bccList: coachEmails,
        toEmail: "questsbclub@gmail.com",
        availability,
        startTime,
        endTime,
        carpool: carpool.join(", "),
        driveCapacity,
        parentAttending: parentAttending ? "Yes" : "No",
        canModerate: canModerate ? "Yes" : "No",
        canScorekeep: canScorekeep ? "Yes" : "No",
        additionalInfo,
        allInfo: JSON.stringify(signup, null, 2),
      });
    } else {
      // CREATE MODE: add new doc, NO EMAIL
      await addDoc(
        collection(db, "signups", tournamentId as string, "entries"),
        signup
      );
      alert("Signup submitted!");
      // You can optionally redirect here (navigate("/")) or stay on page
    }
    navigate("/profile");
    setSubmitting(false);
  };
  

  if (!tournament) return <div className="text-center mt-5">Loading tournament...</div>;
  if (loadingPlayers) return <div className="text-center mt-5">Loading players...</div>;

  return (
      <div
        style={{
          background: "linear-gradient(90deg, #fff6f6 0%, #ffeaea 100%)",
          minHeight: "100vh",
          paddingTop: 60,
        }}
      >
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Tournament Card */}
              <div
                className="card shadow mb-5"
                style={{
                  background: "#fff",
                  border: "2px solid #DF2E38",
                  borderRadius: 20,
                }}
              >
                <div className="card-body text-center px-5 py-4">
                  <h1
                    className="display-5 mb-2"
                    style={{ color: "#DF2E38", fontWeight: 900 }}
                  >
                    {tournament.eventName}
                  </h1>
                  <div className="mb-2" style={{ fontSize: 19, color: "#B71C1C" }}>
                    <span role="img" aria-label="calendar" style={{ fontSize: 24 }}>
                      📅
                    </span>{" "}
                    {tournament.date}
                  </div>
                  <div className="mb-2" style={{ fontSize: 16, color: "#a22" }}>
                    {tournament.location}
                  </div>
                  {tournament.eventType && (
                    <span
                      className="badge mx-2"
                      style={{
                        fontSize: 14,
                        background: "#fff0f0",
                        color: "#B71C1C",
                        border: "1px solid #DF2E38",
                        fontWeight: 700,
                      }}
                    >
                      {tournament.eventType}
                    </span>
                  )}
                  {tournament.status && (
                    <span
                      className="badge mx-2"
                      style={{
                        background:
                          tournament.status === "confirmed"
                            ? "#DF2E38"
                            : tournament.status === "cancelled"
                            ? "#f96d6d"
                            : "#ffe17b",
                        color:
                          tournament.status === "tentative"
                            ? "#a06b00"
                            : "#fff",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {tournament.status.charAt(0).toUpperCase() +
                        tournament.status.slice(1)}
                    </span>
                  )}
                  <div className="mt-3" style={{ fontSize: 15, color: "#B71C1C" }}>
                    {tournament.startTime && (
                      <span>
                        <b>Start:</b> {tournament.startTime} &nbsp;|&nbsp;{" "}
                      </span>
                    )}
                    {tournament.endTime && (
                      <span>
                        <b>End:</b> {tournament.endTime} &nbsp;|&nbsp;{" "}
                      </span>
                    )}
                    {tournament.rsvpDate && (
                      <span>
                        <b>RSVP By:</b> {tournament.rsvpDate}{" "}
                        {tournament.rsvpTime || ""} &nbsp;|&nbsp;{" "}
                      </span>
                    )}
                    {tournament.rules && (
                      <span>
                        <b>Rules:</b> {tournament.rules} &nbsp;|&nbsp;{" "}
                      </span>
                    )}
                    {tournament.shirtColor && (
                      <span>
                        <b>Shirt:</b> {tournament.shirtColor} &nbsp;|&nbsp;{" "}
                      </span>
                    )}
                    {tournament.additionalInfo && (
                      <span>
                        <b>Notes:</b> {tournament.additionalInfo}
                      </span>
                    )}
                  </div>
                </div>
              </div>

            {/* Registration Form */}
            <div
            className="card shadow-lg"
            style={{
              borderRadius: 20,
              border: "1.5px solid #DF2E38",
              background: "#fff",
            }}
          >
            <div className="card-body px-5 py-4">
              <h4 className="mb-4" style={{ fontWeight: 700, color: "#DF2E38" }}>
                Event Registration
              </h4>
                <div className="form-group mb-3">
                  <label htmlFor="playerSelect" style={{ fontWeight: 500 }}>
                    Select Player:
                  </label>
                  <select
                    className="form-control"
                    id="playerSelect"
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                  >
                    <option value="">-- Choose a player --</option>
                    {linkedPlayers.map((p) => (
                      <option key={p.uid} value={p.uid}>
                        {`${p.firstName} ${p.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>
                {linkedPlayers.length === 0 && (
                  <div
                    className="alert alert-info mt-3"
                    style={{ borderRadius: 12 }}
                  >
                    No players linked to your account. Please link a player in
                    your profile to register for events.
                  </div>
                )}

                {fetchingSignup && (
                  <div className="text-center text-secondary py-3">
                    <span className="spinner-border spinner-border-sm" /> Loading
                    signup info...
                  </div>
                )}

                {selectedPlayer && !fetchingSignup && (
                  <>
                    <div className="form-group mb-3">
                      <label htmlFor="availability" style={{ fontWeight: 500 }}>
                        Availability:
                      </label>
                      <select
                        id="availability"
                        className="form-control"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                      >
                        <option value="">Select Availability</option>
                        <option value="yes">Can Attend</option>
                        <option value="no">Cannot Attend</option>
                        <option value="early">
                          Can Come but Has to Leave Early
                        </option>
                        <option value="late">Can Come Late</option>
                        <option value="late_early">
                          Can Come Late and Leave Early
                        </option>
                      </select>
                    </div>
                    {showStartTime && (
                      <div className="form-group mb-3">
                        <label htmlFor="startTime" style={{ fontWeight: 500 }}>
                          Estimated Arrival Time:
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          id="startTime"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                    )}
                    {showEndTime && (
                      <div className="form-group mb-3">
                        <label htmlFor="endTime" style={{ fontWeight: 500 }}>
                          Estimated Departure Time:
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          id="endTime"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="form-group mb-3">
                      <label htmlFor="carpoolOptions" style={{ fontWeight: 500 }}>
                        Carpool Options:
                      </label>
                      <select
                        multiple
                        className="form-control"
                        id="carpoolOptions"
                        value={carpool}
                        onChange={(e) =>
                          setCarpool(
                            Array.from(e.target.selectedOptions, (opt) => opt.value)
                          )
                        }
                      >
                        <option value="can-drive">Can Drive</option>
                        <option value="needs-ride">Needs a Ride</option>
                      </select>
                    </div>
                    {carpool.includes("can-drive") && (
                      <div className="form-group mb-3">
                        <label htmlFor="driveCapacity" style={{ fontWeight: 500 }}>
                          Can drive how many people?
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="driveCapacity"
                          value={driveCapacity}
                          onChange={(e) => setDriveCapacity(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="form-group mb-3">
                      <label style={{ fontWeight: 500 }}>
                        Will a Parent Attend?
                      </label>
                      <select
                        className="form-control"
                        value={parentAttending ? "yes" : "no"}
                        onChange={(e) =>
                          setParentAttending(e.target.value === "yes")
                        }
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {parentAttending && (
                      <div className="form-group mb-3">
                        <label style={{ fontWeight: 500 }}>
                          Parent Volunteer Options:
                        </label>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="canModerate"
                            checked={canModerate}
                            onChange={() => setCanModerate(!canModerate)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="canModerate"
                          >
                            Can Moderate
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="canScorekeep"
                            checked={canScorekeep}
                            onChange={() => setCanScorekeep(!canScorekeep)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="canScorekeep"
                          >
                            Can Scorekeep
                          </label>
                        </div>
                      </div>
                    )}
                    <div className="form-group mb-3">
                      <label
                        htmlFor="additionalInfo"
                        style={{ fontWeight: 500 }}
                      >
                        Additional Information:
                      </label>
                      <textarea
                        className="form-control"
                        id="additionalInfo"
                        rows={3}
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        style={{ borderRadius: 10, fontSize: 15 }}
                      />
                    </div>
                    <div className="text-center mt-4">
                <button
                  className="btn"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    background: "linear-gradient(90deg,#DF2E38 0,#B71C1C 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: 15,
                    padding: "13px 0",
                    width: "70%",
                    fontSize: 17,
                    boxShadow: "0 2px 10px #ffccd5",
                    letterSpacing: "0.04em",
                  }}
                >
                  {submitting
                    ? "Submitting..."
                    : existingSignupDocId
                    ? "Edit Signup"
                    : "Submit Registration"}
                </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* --- TEAMS & DRIVERS --- */}
      <div className="row mt-5">
        <div className="col-12 mb-5">
          <h3 className="mb-3" style={{ color: "#DF2E38", fontWeight: 800 }}>
            Teams
          </h3>
          <div className="row">
            {teams.length === 0 && (
              <div className="col-12 text-center text-muted">
                <em>No teams have been added for this tournament yet.</em>
              </div>
            )}
            {teams.map((team) => {
              // Map players
              const teamPlayers = team.players
                .map((tp) => {
                  const signup = signups.find((s) => s.id === tp.signupId);
                  if (!signup) return null;
                  const player = playerMap[signup.playerId];
                  return {
                    ...tp,
                    ...signup,
                    fullName: player
                      ? `${player.firstName} ${player.lastName}`
                      : "Unknown",
                  };
                })
                .filter(Boolean);

              const captain = teamPlayers.find((tp) => tp?.isCaptain);

              return (
                <div className="col-md-4 mb-3" key={team.id}>
                  <div
                    className="card shadow-sm h-100"
                    style={{
                      borderRadius: 16,
                      border: "1.5px solid #DF2E38",
                      background: "#FFF7F7",
                    }}
                  >
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
  if (!tp) return null; // guard against null/undefined
  return (
    <li key={tp.signupId}>
      <span style={{ color: "#B71C1C", fontWeight: tp.isCaptain ? 700 : 500 }}>
        {tp.fullName}
      </span>
      {tp.isCaptain && (
        <span
          className="badge ms-2"
          style={{
            background: "#DF2E38",
            color: "#fff",
            borderRadius: "10px",
            fontSize: "0.9em",
            fontWeight: 700,
          }}
        >
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
        </div>
          {/* Drivers & Seats Card */}
          <div className="col-12">
          <div
            className="card shadow mb-5"
            style={{ borderRadius: 16, border: "1.5px solid #DF2E38", background: "#FFF7F7" }}
          >
            <div className="card-body">
              <h4 style={{ color: "#DF2E38", fontWeight: 700 }}>
                Drivers & Seats
              </h4>
              <ul style={{ fontSize: 17 }}>
                {signups.filter((s) => s.carpool?.includes("can-drive")).length === 0 ? (
                  <li className="text-muted">No drivers yet!</li>
                ) : (
                  signups
                    .filter((s) => s.carpool?.includes("can-drive"))
                    .map((s, idx) => {
                      const player = playerMap[s.playerId];
                      return (
                        <li key={s.playerId + idx} style={{ color: "#B71C1C", fontWeight: 600 }}>
                          {player
                            ? `${player.firstName} ${player.lastName}`
                            : s.playerId}{" "}
                          —{" "}
                          <b>
                            {s.driveCapacity !== undefined
                              ? s.driveCapacity
                              : 0}
                          </b>{" "}
                          seat(s)
                        </li>
                      );
                    })
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default TournamentPage;
