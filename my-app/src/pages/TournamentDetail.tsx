import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDoc, doc, collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, getAuth, User as FirebaseUser } from "firebase/auth";
import { db } from "../.firebase/utils/firebase";
import { Tournament } from "../types/event";
import { Player } from "../types/player";
import { Signup } from "../types/signup";

const lightBlue = "#e9f3ff";
const green = "#6BCB77";
const blue = "#2e3a59";

const TournamentPage: React.FC = () => {
  const { id } = useParams();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [linkedPlayers, setLinkedPlayers] = useState<Player[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
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

  const showStartTime = availability === "late" || availability === "late_early";
  const showEndTime = availability === "early" || availability === "late_early";

  // Fetch auth and linked players
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
      setLoadingPlayers(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch tournament details
  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) return;
      const docRef = doc(db, "tournaments", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) setTournament(snap.data() as Tournament);
    };
    fetchTournament();
  }, [id]);

  // --- SUBMIT HANDLER ---
  const handleSubmit = async () => {
    if (!selectedPlayer || !currentUser || !id) return;
    setSubmitting(true);

    // 1. Duplicate signup prevention
    const entriesRef = collection(db, "signups", id as string, "entries");
    const existingQ = query(
      entriesRef,
      where("userId", "==", currentUser.uid),
      where("playerId", "==", selectedPlayer)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      alert("You have already registered this player for this tournament.");
      setSubmitting(false);
      return;
    }

    // Build signup object: only include fields if set!
    const signup: Signup = {
      tournamentId: id as string,
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

    // 2. Write signup to subcollection
    await addDoc(entriesRef, signup);
    alert("Signup submitted!");
    setSubmitting(false);
  };

  if (!tournament) return <div className="text-center mt-5">Loading tournament...</div>;
  if (loadingPlayers) return <div className="text-center mt-5">Loading players...</div>;

  return (
    <div style={{ background: "linear-gradient(90deg, #f2f7fd 0%, #e5fcec 100%)", minHeight: "100vh", paddingTop: 60 }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Tournament Card */}
            <div
              className="card shadow mb-5"
              style={{
                background: "linear-gradient(90deg, #e0ecff 0%, #e8ffe6 100%)",
                border: "none",
                borderRadius: 18,
              }}>
              <div className="card-body text-center px-5 py-4">
                <h1 className="display-5 mb-2" style={{ color: blue, fontWeight: 800 }}>{tournament.eventName}</h1>
                <div className="mb-2" style={{ fontSize: 19, color: "#758bad" }}>
                  <span role="img" aria-label="calendar" style={{ fontSize: 24 }}>📅</span> {tournament.date}
                </div>
                <div className="mb-2" style={{ fontSize: 16, color: "#55877e" }}>{tournament.location}</div>
                {tournament.eventType && <span className="badge badge-info mx-2" style={{ fontSize: 14, color: "#222" }}>{tournament.eventType}</span>}
                {tournament.status && (
                  <span className="badge mx-2"
                    style={{
                      background: tournament.status === "confirmed" ? green : tournament.status === "cancelled" ? "#f96d6d" : "#ffd600",
                      color: tournament.status === "tentative" ? "#5c5a00" : "#fff",
                      fontSize: 14
                    }}>
                    {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                  </span>
                )}
                <div className="mt-3" style={{ fontSize: 15 }}>
                  {tournament.startTime && <span><b>Start:</b> {tournament.startTime} &nbsp;|&nbsp; </span>}
                  {tournament.endTime && <span><b>End:</b> {tournament.endTime} &nbsp;|&nbsp; </span>}
                  {tournament.rsvpDate && <span><b>RSVP By:</b> {tournament.rsvpDate} {tournament.rsvpTime || ""} &nbsp;|&nbsp; </span>}
                  {tournament.rules && <span><b>Rules:</b> {tournament.rules} &nbsp;|&nbsp; </span>}
                  {tournament.shirtColor && <span><b>Shirt:</b> {tournament.shirtColor} &nbsp;|&nbsp; </span>}
                  {tournament.additionalInfo && <span><b>Notes:</b> {tournament.additionalInfo}</span>}
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div className="card shadow-lg" style={{ borderRadius: 18, border: "none" }}>
              <div className="card-body px-5 py-4">
                <h4 className="mb-4" style={{ fontWeight: 600, color: "#2155CD" }}>
                  Event Registration
                </h4>
                <div className="form-group mb-3">
                  <label htmlFor="playerSelect" style={{ fontWeight: 500 }}>Select Player:</label>
                  <select
                    className="form-control"
                    id="playerSelect"
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                  >
                    <option value="">-- Choose a player --</option>
                    {linkedPlayers.map((p) => (
                      <option key={p.uid} value={p.uid}>{`${p.firstName} ${p.lastName}`}</option>
                    ))}
                  </select>
                </div>
                {linkedPlayers.length === 0 && (
                  <div className="alert alert-info mt-3" style={{ borderRadius: 12 }}>
                    No players linked to your account. Please link a player in your profile to register for events.
                  </div>
                )}

                {selectedPlayer && (
                  <>
                    <div className="form-group mb-3">
                      <label htmlFor="availability" style={{ fontWeight: 500 }}>Availability:</label>
                      <select
                        id="availability"
                        className="form-control"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                      >
                        <option value="">Select Availability</option>
                        <option value="yes">Can Attend</option>
                        <option value="no">Cannot Attend</option>
                        <option value="early">Can Come but Has to Leave Early</option>
                        <option value="late">Can Come Late</option>
                        <option value="late_early">Can Come Late and Leave Early</option>
                      </select>
                    </div>
                    {showStartTime && (
                      <div className="form-group mb-3">
                        <label htmlFor="startTime" style={{ fontWeight: 500 }}>Estimated Arrival Time:</label>
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
                        <label htmlFor="endTime" style={{ fontWeight: 500 }}>Estimated Departure Time:</label>
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
                      <label htmlFor="carpoolOptions" style={{ fontWeight: 500 }}>Carpool Options:</label>
                      <select
                        multiple
                        className="form-control"
                        id="carpoolOptions"
                        value={carpool}
                        onChange={(e) => setCarpool(Array.from(e.target.selectedOptions, (opt) => opt.value))}
                      >
                        <option value="can-drive">Can Drive</option>
                        <option value="needs-ride">Needs a Ride</option>
                      </select>
                    </div>
                    {carpool.includes("can-drive") && (
                      <div className="form-group mb-3">
                        <label htmlFor="driveCapacity" style={{ fontWeight: 500 }}>Can drive how many people?</label>
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
                      <label style={{ fontWeight: 500 }}>Will a Parent Attend?</label>
                      <select
                        className="form-control"
                        value={parentAttending ? "yes" : "no"}
                        onChange={(e) => setParentAttending(e.target.value === "yes")}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {parentAttending && (
                      <div className="form-group mb-3">
                        <label style={{ fontWeight: 500 }}>Parent Volunteer Options:</label>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="canModerate"
                            checked={canModerate}
                            onChange={() => setCanModerate(!canModerate)}
                          />
                          <label className="form-check-label" htmlFor="canModerate">
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
                          <label className="form-check-label" htmlFor="canScorekeep">
                            Can Scorekeep
                          </label>
                        </div>
                      </div>
                    )}
                    <div className="form-group mb-3">
                      <label htmlFor="additionalInfo" style={{ fontWeight: 500 }}>Additional Information:</label>
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
                          background: "linear-gradient(90deg,#2155CD 0,#6BCB77 100%)",
                          color: "#fff",
                          fontWeight: 600,
                          borderRadius: 12,
                          padding: "12px 0",
                          width: "70%",
                          fontSize: 16,
                          boxShadow: "0 2px 8px #b4c4ec2d"
                        }}>
                        {submitting ? "Submitting..." : "Submit Registration"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;
