import React, { useEffect, useState } from "react";
import { data, useParams } from "react-router-dom";
import {getDoc,doc,collection,addDoc,query,where,getDocs, updateDoc,serverTimestamp,} from "firebase/firestore";
import {onAuthStateChanged,getAuth,User as FirebaseUser,} from "firebase/auth";
import { db } from "../.firebase/utils/firebase";
import { Tournament } from "../types/event";
import { Player } from "../types/player";
import { Signup } from "../types/signup";
import emailjs from "emailjs-com";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { getCollection } from "../hooks/firestore";


const green = "#6BCB77";
const blue = "#2e3a59";
const TEMPLATE_ID = "template_lsh00qp";
const SERVICE_ID = "service_cfows1h";
const EMAIL_API_KEY = "GRAfhbyKXL9qsCDKk";


// Helper to format date with day of week
function formatDateWithDay(dateString: string) {
  if (!dateString) return "";
  const date = parseISO(dateString);
  return format(date, "EEEE, MMMM d, yyyy"); // e.g. Saturday, July 20, 2025
}

// Helper to format time to 12hr am/pm
function formatTime12hr(timeString: string) {
  if (!timeString) return "";
  let [h, m] = timeString.split(":");
  const hourNum = Number(h);
  const ampm = hourNum >= 12 ? "PM" : "AM";
  const hour12 = ((hourNum + 11) % 12 + 1); // converts 0->12, 13->1
  return `${hour12}:${m.padStart(2, "0")} ${ampm}`;
}


// Utility function to fetch all coaches' emails
async function getAllCoachEmails() {
  const coachesSnap = await getDocs(
    query(collection(db, "users"), where("role", "==", "coach"))
  );
  return coachesSnap.docs.map((doc) => doc.data().email).filter(Boolean);
}
type InfoRowProps = {
  label: string;
  value?: string | number | null;
};

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) =>
  value ? (
    <div className="d-flex align-items-baseline justify-content-center mb-2">
      <span style={{ fontWeight: 700, color: "#B71C1C", minWidth: 100 }}>{label}:</span>
      <span style={{ marginLeft: 8, fontWeight: 500, color: "#232323" }}>{value}</span>
    </div>
  ) : null;

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

const TournamentPage: React.FC= () => {
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
  const [carpool, setCarpool] = useState<string>("");
  const [driveCapacity, setDriveCapacity] = useState("");
  const [parentAttending, setParentAttending] = useState(false);
  const [canModerate, setCanModerate] = useState(false);
  const [canScorekeep, setCanScorekeep] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parentName, setParentName] = useState("");
  const [playerSignupDocId, setPlayerSignupDocId] = useState<string | null>(null);
  const [coachSignupDocId, setCoachSignupDocId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // --- Team, Signup, Player Data ---
  const [teams, setTeams] = useState<TeamDoc[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [signups, setSignups] = useState<SignupDoc[]>([]);
  const [playerMap, setPlayerMap] = useState<PlayerMap>({});
  const [existingSignupDocId, setExistingSignupDocId] = useState<string | null>(null);
  const [fetchingSignup, setFetchingSignup] = useState(false);
  const [signupMode, setSignupMode] = useState<"player" | "coach">("player");
  const showStartTime = availability === "late" || availability === "late_early";
  const showEndTime = availability === "early" || availability === "late_early";

useEffect(() => {
  const loadSignups = async () => {
    if (!tournamentId) throw new Error("Tournament ID is required");
    const playerSnap = await getDocs(collection(db, "signups", tournamentId, "entries"));
    const coachSnap = await getDocs(collection(db, "coach_signups", tournamentId, "entries"));

    const playerEntries = playerSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as SignupDoc));
    const coachEntries = coachSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as SignupDoc));

    // Optional: prevent duplicates based on userId/playerId
    const seen = new Set();
    const allEntries = [...playerEntries, ...coachEntries].filter((entry) => {
      const key = entry.playerId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setSignups(allEntries);
  };

  if (tournamentId) loadSignups();
}, [tournamentId]);


  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      const docRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfile({ ...snap.data(), uid: snap.id });
      }
    };
    fetchProfile();
  }, [currentUser]);
  const userRole = profile?.role || "player";
  useEffect(() => {
    if (userRole === "player" && currentUser) {
      setSelectedPlayer(currentUser.uid);
    }
  }, [userRole, currentUser]);

  const resetFormFields = () => {
    setAvailability("");
    setStartTime("");
    setEndTime("");
    setCarpool("");
    setDriveCapacity("");
    setParentAttending(false);
    setParentName("");
    setCanModerate(false);
    setCanScorekeep(false);
    setAdditionalInfo("");
  };
  

  useEffect(() => {
  if (!tournamentId || !currentUser) return;

  const fetchSignup = async () => {
    resetFormFields();

    const collectionName = signupMode === "coach" ? "coach_signups" : "signups";
    const entriesRef = collection(db, collectionName, tournamentId, "entries");

    const queryField = signupMode === "coach" ? "userId" : "playerId";
    const queryValue = signupMode === "coach" ? currentUser.uid : selectedPlayer;

    // Only run if playerId or userId exists
    if (!queryValue) return;

    const q = query(entriesRef, where(queryField, "==", queryValue));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const existing = snap.docs[0];
      const data = existing.data();

      if (signupMode === "coach") {
        setCoachSignupDocId(existing.id);
      } else {
        setPlayerSignupDocId(existing.id);
      }

      // Autofill the form
      setAvailability(data.availability || "");
      setStartTime(data.startTime || "");
      setEndTime(data.endTime || "");
      setCarpool(data.carpool || "");
      setDriveCapacity(data.driveCapacity || "");
      setParentAttending(data.parentAttending ?? false);
      setParentName(data.parentName || "");
      setCanModerate(data.canModerate || false);
      setCanScorekeep(data.canScorekeep || false);
      setAdditionalInfo(data.additionalInfo || "");
    } else {
      // Clear existingSignupDocId to ensure button says "Sign Up"
      if (signupMode === "coach") {
        setCoachSignupDocId(null);
      } else {
        setPlayerSignupDocId(null);
      }
    }
  };

  fetchSignup();
}, [signupMode, selectedPlayer, tournamentId]);

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
  // 🧠 Get the favorite player (the only one in linkedPlayers array)
const favoritePlayer = linkedPlayers?.[0] || "";
useEffect(() => {
  const loadPlayers = async () => {
    if (!currentUser) return;

    const userWithRole = currentUser as FirebaseUser & { role?: string };

    if (userWithRole.role === "coach") {
      const players = await getCollection<any>("players");
      console.log("Loaded all players:", players);
      setAllPlayers(players);
    } else {
      setAllPlayers([]); // Reset for non-coaches
    }
  };

  loadPlayers();
}, [currentUser]);

useEffect(() => {
  const loadStuff = async () => {
    const players = await getCollection<any>("players");
    setAllPlayers(players);
  };
  loadStuff();
}, []);

console.log("🔗 linkedPlayers:", linkedPlayers); // should show both player IDs
console.log("⭐ favoritePlayerId:", favoritePlayer.firstName); // just one ID
console.log("📋 allPlayers:", allPlayers); // should show all player IDs
console.log("🧠 playerMap:", playerMap); // should show ID → Player object map


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
    if (!tournamentId || fetchingSignup) return;
  
    const fetchSignup = async () => {
      const entriesRef = collection(
        db,
        signupMode === "coach" ? "coach_signups" : "signups",
        tournamentId,
        "entries"
      );
  
      const q = signupMode === "coach"
        ? query(entriesRef, where("userId", "==", currentUser?.uid))
        : selectedPlayer
          ? query(entriesRef, where("playerId", "==", selectedPlayer))
          : null;
  
      if (!q) return;
  
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existing = snap.docs[0];
        signupMode === "coach"
  ? setCoachSignupDocId(existing.id)
  : setPlayerSignupDocId(existing.id);
        const data = existing.data();
  
        setAvailability(data.availability || []);
        setStartTime(data.startTime || "");
        setEndTime(data.endTime || "");
        setCarpool(data.carpool || []);
        setDriveCapacity(data.driveCapacity || 0);
        setParentAttending(data.parentAttending ?? false);
        setParentName(data.parentName || "");
        setCanModerate(data.canModerate || false);
        setCanScorekeep(data.canScorekeep || false);
        setAdditionalInfo(data.additionalInfo || "");
      }
  
      setFetchingSignup(false);
    };
  
    fetchSignup();
  }, [selectedPlayer, signupMode, tournamentId]);


    const handleSubmit = async () => {
      if (!currentUser || !tournamentId || (signupMode === "player" && !selectedPlayer)) return;
    
      // --- Field validation ---
      if (!availability) return alert("Please select your availability.");
      if ((availability === "late" || availability === "late_early") && !startTime)
        return alert("Please enter your arrival time.");
      if ((availability === "early" || availability === "late_early") && !endTime)
        return alert("Please enter your departure time.");
      if (!carpool) return alert("Please choose a carpool option.");
      if (carpool === "can-drive" && !driveCapacity)
        return alert("Please enter the number of available seats.");
    
      if (signupMode === "player" && parentAttending) {
        if (!parentName) return alert("Please enter the parent’s name.");
        if (!canModerate && !canScorekeep)
          return alert("Please select at least one parent volunteer option.");
      }
    
      if (signupMode === "coach" && !canModerate && !canScorekeep) {
        return alert("Please select at least one coach volunteer option.");
      }
    setSubmitting(true);
    const existingDocId = signupMode === "coach" ? coachSignupDocId : playerSignupDocId;

    // Build signup object
    const signup: Signup = {
      tournamentId: tournamentId as string,
      userId: currentUser.uid,
      playerId: signupMode === "player" ? selectedPlayer : currentUser.uid,
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
      ...(parentAttending && parentName ? { parentName } : {})
    };
  
    // Always check Firestore for this player/tournament signup
    const entriesRef = collection(
      db,
      signupMode === "coach" ? "coach_signups" : "signups",
      tournamentId,
      "entries"
    );    
    const existingQ = signupMode === "coach"
  ? query(entriesRef, where("userId", "==", currentUser.uid))
  : query(entriesRef, where("playerId", "==", selectedPlayer));
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
        carpool,
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
        collection(db, signupMode === "coach" ? "coach_signups" : "signups", tournamentId as string, "entries"),
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
  const shouldShowForm =
  (userRole === "player") ||
  (userRole === "parent" && selectedPlayer) ||
  (userRole === "coach" && signupMode === "player" && selectedPlayer) ||
  (userRole === "coach" && signupMode === "coach");

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
                <>
  <h1
    className="display-5 mb-3"
    style={{ color: "#DF2E38", fontWeight: 900 }}
  >
    {tournament.eventName}
  </h1>
  <div style={{
    fontSize: 18,
    color: "#B71C1C",
    fontWeight: 600,
    marginBottom: 8
  }}>
    {formatDateWithDay(tournament.date)}
  </div>

  <InfoRow label="Location" value={tournament.location} />

  <InfoRow
    label="Time"
    value={
      tournament.startTime && tournament.endTime
        ? `${formatTime12hr(tournament.startTime)} — ${formatTime12hr(tournament.endTime)}`
        : tournament.startTime
        ? `${formatTime12hr(tournament.startTime)}`
        : tournament.endTime
        ? `${formatTime12hr(tournament.endTime)}`
        : "—"
    }
  />

  <InfoRow
    label="RSVP By"
    value={
      tournament.rsvpDate
        ? tournament.rsvpTime
          ? `${formatDateWithDay(tournament.rsvpDate)} at ${formatTime12hr(tournament.rsvpTime)}`
          : formatDateWithDay(tournament.rsvpDate)
        : null
    }
  />

  <InfoRow label="Rules" value={tournament.rules} />
  <InfoRow label="Shirt Color" value={tournament.shirtColor} />
  <InfoRow label="Notes" value={tournament.additionalInfo} />

  {/* Event Type & Status as badges */}
  <div className="mt-3 mb-1 d-flex justify-content-center flex-wrap gap-2">
    {tournament.eventType && (
      <span
        className="badge"
        style={{
          fontSize: 15,
          background: "#fff0f0",
          color: "#B71C1C",
          border: "1px solid #DF2E38",
          fontWeight: 700,
        }}
      >
        {tournament.eventType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
      </span>
    )}
    {tournament.status && (
      <span
        className="badge"
        style={{
          background:
            tournament.status === "confirmed"
              ? "#6BCB77"
              : tournament.status === "cancelled"
              ? "#F96D6D"
              : "#FFD166",
          color:
            tournament.status === "tentative"
              ? "#8A6D00"
              : "#fff",
          fontSize: 15,
          fontWeight: 700,
          padding: "9px 14px",
          borderRadius: 12,
        }}
      >
        {tournament.status === "confirmed"
          ? "Confirmed"
          : tournament.status === "tentative"
          ? "Tentative"
          : "Cancelled"}
      </span>
    )}
  </div>
</>
                </div>
              </div>
            {/* Registration Form */}
            {shouldShowForm && (
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
  <label htmlFor="signupMode" style={{ fontWeight: 500 }}>I'm signing up as:</label>
  <select
  value={signupMode}
  onChange={(e) => {
    const selected = e.target.value;
    if (selected === "coach" && userRole !== "coach") {
      alert("Only coaches can sign up as coaches.");
      return;
    }
    setSignupMode(selected as "player" | "coach");
  }}
>
  <option value="player">Sign up as Player</option>
  {userRole === "coach" && <option value="coach">Sign up as Coach</option>}
</select>

</div>
<div className="form-group mb-3">
  <label htmlFor="playerSelect" style={{ fontWeight: 500 }}>
    Select Player<span style={{ color: "red" }}> *</span>
  </label>
  {userRole === "coach" && signupMode === "player" && (
  <div className="form-group mb-3">
    <select
      className="form-control"
      value={selectedPlayer}
      onChange={(e) => setSelectedPlayer(e.target.value)}
      required
    >
      {favoritePlayer && (
        <optgroup label="⭐ Favorite Player">
          <option value={favoritePlayer.uid}>
            {favoritePlayer.firstName} {favoritePlayer.lastName}
          </option>
        </optgroup>
      )}
      <optgroup label="All Players">
        {allPlayers
          .filter((p) => p.uid !== favoritePlayer?.uid)
          .map((p) => (
            <option key={p.uid} value={p.uid}>
              {p.firstName} {p.lastName}
            </option>
          ))}
      </optgroup>
    </select>
  </div>
)}

{userRole === "parent" && (
  <div className="form-group mb-3">
    <label style={{ fontWeight: 500 }}>Select Player*</label>
    <select
      className="form-control"
      value={selectedPlayer}
      onChange={(e) => setSelectedPlayer(e.target.value)}
      required
    >
      <option value="" disabled>Select one</option>
      {linkedPlayers.map((p) => (
        <option key={p.uid} value={p.uid}>
          {p.firstName} {p.lastName}
        </option>
      ))}
    </select>
  </div>
)}


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

                {(signupMode === "coach" || selectedPlayer) && !fetchingSignup && (
                  <>
                    <div className="form-group mb-3">
                      <label htmlFor="availability" style={{ fontWeight: 500 }}>
                        Availability: <span style={{ color: "red" }}>*</span>
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
                          Estimated Arrival Time: <span style={{ color: "red" }}>*</span>
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
                          Estimated Departure Time: <span style={{ color: "red" }}>*</span>
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
  <label style={{ fontWeight: 500 }}>Carpool Options: <span style={{ color: "red" }}>*</span> </label>
  <div style={{ display: "flex", gap: "14px" }}>
  <div className="form-group mb-3">
      <div style={{ display: "flex", gap: "14px" }}>
    <button
      type="button"
      className={`btn ${carpool === "can-drive" ? "btn-success" : "btn-outline-secondary"}`}
      style={{
        borderRadius: 12,
        fontWeight: 600,
        background: carpool === "can-drive" ? "#6BCB77" : "#fff",
        color: carpool === "can-drive" ? "#fff" : "#2e3a59",
        border: carpool === "can-drive" ? "2px solid #6BCB77" : "2px solid #dadada",
        boxShadow: carpool === "can-drive" ? "0 2px 8px #6bcb7711" : "none",
        transition: "all 0.12s"
      }}
      onClick={() => setCarpool("can-drive")}
    >
      {signupMode === "coach" ? "Can Drive" : "Parent Can Drive"}
    </button>
    <button
      type="button"
      className={`btn ${carpool === "needs-ride" ? "btn-warning" : "btn-outline-secondary"}`}
      style={{
        borderRadius: 12,
        fontWeight: 600,
        background: carpool === "needs-ride" ? "#FFD166" : "#fff",
        color: carpool === "needs-ride" ? "#222" : "#2e3a59",
        border: carpool === "needs-ride" ? "2px solid #FFD166" : "2px solid #dadada",
        boxShadow: carpool === "needs-ride" ? "0 2px 8px #ffd16633" : "none",
        transition: "all 0.12s"
      }}
      onClick={() => setCarpool("needs-ride")}
    >
      Needs A Ride
    </button>
  </div>
</div>

  </div>
</div>

{carpool === "can-drive" && (
  <div className="form-group mb-3">
    <label htmlFor="driveCapacity" style={{ fontWeight: 500 }}>
       Can drive how many additional people? <span style={{ color: "red" }}>*</span>
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
{signupMode === "coach" && (
  <div className="form-group mb-3">
    <label style={{ fontWeight: 500 }}>Coach Volunteer Options:</label>
    <div className="form-check">
      <input
        className="form-check-input"
        type="checkbox"
        id="canModerate"
        checked={canModerate}
        onChange={() => setCanModerate(!canModerate)}
      />
      {tournament.needsModerators && (
      <label className="form-check-label" htmlFor="canModerate">
        Can Moderate
      </label>
      )}
    </div>
    <div className="form-check">
      <input
        className="form-check-input"
        type="checkbox"
        id="canScorekeep"
        checked={canScorekeep}
        onChange={() => setCanScorekeep(!canScorekeep)}
      />
      <label className="form-check-label" htmlFor="canScorekeep">
        Can Scorekeep
      </label>
    </div>
  </div>
)}

{signupMode === "player" && (
  <>
                    <div className="form-group mb-3">
                      <label style={{ fontWeight: 500 }}>
                        Will a Parent Attend? <span style={{ color: "red" }}>*</span>
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
                        <div className="form-group mb-3">
    <label htmlFor="parentName" style={{ fontWeight: 500 }}>
      Parent's Name <span style={{ color: "red" }}>*</span>
    </label>
    <input
      type="text"
      className="form-control"
      id="parentName"
      value={parentName}
      onChange={e => setParentName(e.target.value)}
      required={parentAttending}
      placeholder="Enter parent’s full name"
      style={{ borderRadius: 10, fontSize: 15 }}
    />
  </div>
                        <label style={{ fontWeight: 500 }}>
                          Parent Volunteer Options: <span style={{ color: "red" }}>*</span>
                        </label>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="canModerate"
                            checked={canModerate}
                            onChange={() => setCanModerate(!canModerate)}
                          />
                          {tournament.needsModerators && (
                          <label
                            className="form-check-label"
                            htmlFor="canModerate"
                          >
                            Can Moderate
                          </label>
                          )}
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
                      </>
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
  : signupMode === "coach"
    ? coachSignupDocId
      ? "Edit Coach Signup"
      : "Sign Up as Coach"
    : playerSignupDocId
      ? "Edit Player Signup"
      : "Sign Up as Player"}

                </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            )}
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
          </div>
  {/* Row with drivers/riders */}
  <div className="row">
    {/* Drivers & Seats */}
    <div className="col-md-6 mb-4">
      <div
        className="card shadow mb-3"
        style={{ borderRadius: 16, border: "1.5px solid #DF2E38", background: "#FFF7F7" }}
      >
        <div className="card-body">
          <h4 style={{ color: "#DF2E38", fontWeight: 700 }}>Drivers & Seats</h4>
          <ul style={{ fontSize: 17 }}>
            {signups.filter((s) => s.carpool === "can-drive").length === 0 ? (
              <li className="text-muted">No drivers yet!</li>
            ) : (
              signups
                .filter((s) => s.carpool === "can-drive")
                .map((s, idx) => {
                  const player = playerMap[s.playerId];
                  const name =
  s.parentName?.trim()
    ? s.parentName
    : player
      ? `${player.firstName} ${player.lastName}`
      : s.playerId === currentUser?.uid
        ? currentUser.displayName || "Coach"
        : "Unknown";

                
                return (
                  <li key={s.playerId + idx} style={{ color: "#B71C1C", fontWeight: 600 }}>
                    {name} — <b>{s.driveCapacity ?? 0}</b> seat(s)
                  </li>
                
                  );
                })
            )}
          </ul>
        </div>
      </div>
    </div>
    {/* Needs Ride */}
    <div className="col-md-6 mb-4">
      <div
        className="card shadow mb-3"
        style={{ borderRadius: 16, border: "1.5px solid #DF2E38", background: "#FFF7F7" }}
      >
        <div className="card-body">
          <h4 style={{ color: "#DF2E38", fontWeight: 700 }}>Needs A Ride</h4>
          <ul style={{ fontSize: 17 }}>
            {signups.filter((s) => s.carpool === "needs-ride").length === 0 ? (
              <li className="text-muted">No riders yet!</li>
            ) : (
              signups
                .filter((s) => s.carpool === "needs-ride")
                .map((s, idx) => {
                  const player = playerMap[s.playerId];
                  const name =
  player
    ? `${player.firstName} ${player.lastName}`
    : s.playerId === currentUser?.uid
      ? currentUser.displayName || "Coach"
      : "Unknown";

                
                  return (
                    <li key={s.playerId + idx} style={{ color: "#B71C1C", fontWeight: 600 }}>
                      {name}
                    </li>
                  );
                }))
                }
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
