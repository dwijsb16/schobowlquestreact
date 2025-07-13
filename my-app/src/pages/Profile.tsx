import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { setDoc, collection, doc, getDocs, getDoc, query, orderBy } from "firebase/firestore";
import { auth, db } from "../.firebase/utils/firebase";
import { updatePassword } from "firebase/auth";

import {
  getCollection,
  getDocumentById,
  addToArrayInDocument,
  removeFromArrayInDocument,
  updateDocumentFields,
} from "../hooks/firestore";
import { Link } from "react-router-dom";
import { Password } from "@mui/icons-material";

interface TournamentCard {
  id: string;
  eventName: string;
  date: string;
  location?: string;
}
export const passwordRules = [
  { key: "length", text: "At least 6 characters" },
  { key: "upper", text: "At least one uppercase letter" },
  { key: "lower", text: "At least one lowercase letter" },
  { key: "digit", text: "At least one digit" },
  { key: "hasSpecial", text: "At least one special character (e.g. !@#$%^&*)" }
];

export function checkPasswordStrength(password: string) {
  return {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()[\]{};:'",.<>/?\\|`~_\-+=]/.test(password),
  };
}

type Role = "coach" | "parent" | "player" | "default";

const colorMap: Record<Role, string> = {
  coach: "#17a2b8",
  parent: "#ffc107",
  player: "#007bff",
  default: "#6c757d"
};
const statusColor = (status: string) => {
  switch (status) {
    case "Attending":
      return "#6BCB77"; // green
    case "Not Attending":
      return "#FF6B6B"; // red
    case "Leaving Early":
    case "Arriving Late":
    case "Late Arrival & Early Departure":
      return "#FFD93D"; // yellow
    default:
      return "#BDBDBD"; // gray
  }
};

function availabilityLabel(a?: string) {
  switch (a) {
    case "yes": return "Attending";
    case "no": return "Not Attending";
    case "early": return "Leaving Early";
    case "late": return "Arriving Late";
    case "late_early": return "Late Arrival & Early Departure";
    default: return "Signed Up";
  }
}

const ProfileScreen: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("player");
  const [linkedPlayers, setLinkedPlayers] = useState<string[]>([]);
  const [editProfile, setEditProfile] = useState(false);
  const [editValues, setEditValues] = useState({ firstName: "", lastName: "", role: "player", password: "", confirmPassword: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEditLinked, setShowEditLinked] = useState(false);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkedPlayerNames, setLinkedPlayerNames] = useState<string[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [pwMatch, setPwMatch] = useState(true);

const pwStrength = checkPasswordStrength(editValues.password);
useEffect(() => {
  setPwMatch(
    editValues.confirmPassword === "" ||
    editValues.password === editValues.confirmPassword
  );
}, [editValues.password, editValues.confirmPassword]);
  // For "My Signups"
  const [tournaments, setTournaments] = useState<TournamentCard[]>([]);
  const [mySignups, setMySignups] = useState<{
    [tournId: string]: { signedUp: boolean; availability?: string }
  }>({});
  const [loadingSignups, setLoadingSignups] = useState(false);

  // Fetch user & profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        const userDoc = await getDocumentById("users", user.uid);
        if (userDoc) {
          setProfile(userDoc);
          setNeedsProfile(false);
          setFirstName(userDoc.firstName || "");
          setLastName(userDoc.lastName || "");
          setRole(userDoc.role || "player");
          setLinkedPlayers(userDoc.linkedPlayers || []);
        } else {
          setNeedsProfile(true);
        }
      } else {
        setFirebaseUser(null);
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch all players for linking dropdown
  useEffect(() => {
    if (showEditLinked && profile && profile.role !== "player") {
      getCollection<any>("players").then(players => setAllPlayers(players));
    }
  }, [showEditLinked, profile]);

  // Fetch names for linked players (from players collection)
  useEffect(() => {
    const fetchNames = async () => {
      if (!linkedPlayers.length) {
        setLinkedPlayerNames([]);
        return;
      }
      const out: string[] = [];
      for (const uid of linkedPlayers) {
        const playerDoc = await getDocumentById<any>("players", uid);
        if (playerDoc) {
          out.push(`${playerDoc.firstName} ${playerDoc.lastName} (${playerDoc.email || playerDoc.id})`);
        }
      }
      setLinkedPlayerNames(out);
    };
    fetchNames();
  }, [linkedPlayers]);

  // ===== MY SIGNUPS SECTION =====
  useEffect(() => {
    const load = async () => {
      setLoadingSignups(true);
      const today = new Date();
      const tournQuery = query(collection(db, "tournaments"), orderBy("date"));
      const tournSnap = await getDocs(tournQuery);
      const tourns: TournamentCard[] = tournSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as TournamentCard))
        .filter((t) => t.date && new Date(t.date) >= today);

      setTournaments(tourns);

      // For each, check if this user (or their linked players) has a signup
      const status: {
        [k: string]: { signedUp: boolean; availability?: string }
      } = {};
      if (firebaseUser && profile) {
        for (const t of tourns) {
          const signupsRef = collection(db, "signups", t.id, "entries");
          let found: { signedUp: boolean; availability?: string } = { signedUp: false };
          const snap = await getDocs(signupsRef);
          snap.forEach((doc) => {
            const data = doc.data();
            if (
              (profile.role === "player" && data.playerId === firebaseUser.uid) ||
              (profile.role !== "player" && linkedPlayers.includes(data.playerId))
            ) {
              found = { signedUp: true, availability: data.availability };
            }
          });
          status[t.id] = found;
        }
      }
      setMySignups(status);
      setLoadingSignups(false);
    };
    if (firebaseUser && profile) {
      load();
    }
  }, [firebaseUser, profile, linkedPlayers]);

  // Preload edit form with current profile data when toggling
  useEffect(() => {
    if (editProfile && profile) {
      setEditValues({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        role: profile.role || "player",
        password: "",
        confirmPassword: ""
      });
      
      setEditError(null);
    }
  }, [editProfile, profile]);

  // PROFILE CREATION FORM
  if (needsProfile) {
    return (
      <div className="container mt-5">
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: 500, background: "#f7fafd" }}>
          <h2 style={{ color: "#4285f4" }}>Create Your Profile</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!firstName.trim() || !lastName.trim()) {
              setError("Please enter your name.");
              return;
            }
            try {
              const userDoc = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                firstName,
                lastName,
                role,
                linkedPlayers: [],
              };
              await setDoc(doc(db, "users", firebaseUser.uid), userDoc);
              setProfile(userDoc);
              setNeedsProfile(false);
              setError(null);
            } catch (err: any) {
              setError("Error creating profile. Try again.");
            }
          }}>
            <div className="form-group">
              <label>First Name:</label>
              <input
                className="form-control"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              <input
                className="form-control"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Role:</label>
              <select
                className="form-control"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="player">Player</option>
                <option value="coach">Coach</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            {error && <div className="alert alert-danger mt-2">{error}</div>}
            <button className="btn btn-success mt-3 w-100" type="submit">Create Profile</button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN PROFILE PAGE
  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {/* HEADER CARD */}
          {/* HEADER CARD */}
<div
  className="card shadow-sm mb-4"
  style={{
    background: "linear-gradient(90deg, #e0ecff 0%, #fdf7e4 100%)",
    border: "none",
    borderRadius: 18,
    boxShadow: "0 2px 12px 0 #c2d6f5"
  }}>
  <div className="p-4 d-flex align-items-center justify-content-between">
    <div>
      <h2 className="mb-1" style={{ fontWeight: 600 }}>
        Welcome,{" "}
        {editProfile
          ? <>
              <input
                className="form-control d-inline-block"
                style={{ width: 120, display: "inline", fontWeight: 600, marginRight: 4 }}
                placeholder="First Name"
                value={editValues.firstName}
                onChange={e => setEditValues(v => ({ ...v, firstName: e.target.value }))}
              />
              <input
                className="form-control d-inline-block"
                style={{ width: 120, display: "inline", fontWeight: 600, marginLeft: 4 }}
                placeholder="Last Name"
                value={editValues.lastName}
                onChange={e => setEditValues(v => ({ ...v, lastName: e.target.value }))}
              />
            </>
          : `${profile?.firstName || ""} ${profile?.lastName || ""}`}
        <span
          className="ml-2 badge"
          style={{
            background: colorMap[(profile?.role as Role) || "default"],
            color: "#fff",
            fontSize: 15,
            marginLeft: 12,
            padding: "8px 14px",
            borderRadius: 16,
            letterSpacing: 1,
            fontWeight: 500
          }}>
          {editProfile
            ? (
              <select
                className="form-select d-inline-block"
                style={{ width: 120, display: "inline", fontWeight: 500, fontSize: 15, color: "#222" }}
                value={editValues.role}
                onChange={e => setEditValues(v => ({ ...v, role: e.target.value }))}
              >
                <option value="player">Player</option>
                <option value="parent">Parent</option>
              </select>
            ) : (
              profile?.role
                ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                : ""
            )
          }
        </span>
      </h2>
      <div className="mb-1" style={{ fontSize: 14, color: "#666" }}>{firebaseUser?.email}</div>
    </div>
    <div>
      {editProfile ? (
        <>
          <button
            className="btn btn-success btn-sm me-2"
            disabled={savingEdit}
            onClick={async () => {
              setEditError(null);
              if (!editValues.firstName.trim() || !editValues.lastName.trim()) {
                setEditError("Please enter your first and last name.");
                return;
              }
              // Password section
              if (editValues.password || editValues.confirmPassword) {
                if (
                  !pwStrength.length ||
                  !pwStrength.upper ||
                  !pwStrength.lower ||
                  !pwStrength.digit ||
                  !pwStrength.hasSpecial
                ) {
                  setEditError("Password must have at least 6 characters, one uppercase, one lowercase, one digit, and one special character.");
                  return;
                }
                if (editValues.password !== editValues.confirmPassword) {
                  setEditError("Passwords do not match.");
                  return;
                }
                if (!auth.currentUser) {
                  setEditError("You must be logged in to change your password.");
                  return;
                }
                setSavingEdit(true);
                try {
                  await updatePassword(auth.currentUser, editValues.password);
                } catch (err: any) {
                  setEditError("Error changing password.");
                  setSavingEdit(false);
                  return;
                }
              }
            
              setSavingEdit(true);
              try {
                await updateDocumentFields("users", firebaseUser.uid, {
                  firstName: editValues.firstName,
                  lastName: editValues.lastName,
                  role: editValues.role
                });
                setProfile({ ...profile, ...editValues, password: undefined, confirmPassword: undefined });
                setEditProfile(false);
              } catch (err: any) {
                setEditError("Error saving changes. Try again.");
              }
              setSavingEdit(false);
            }}
          >
            {savingEdit ? "Saving..." : "Save"}
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={savingEdit}
            onClick={() => setEditProfile(false)}
          >
            Cancel
          </button>
        </>
      ) : (
        <button className="btn btn-outline-primary btn-sm" onClick={() => setEditProfile(true)}>
          Edit Profile
        </button>
      )}
    </div>
  </div>
  {editError && (
    <div className="px-4 pb-2">
      <div className="alert alert-danger py-2 mb-0">{editError}</div>
    </div>
  )}
  {/* Show password section only during edit */}
  {editProfile && (
  <div className="px-4 pb-3">
    <div className="form-group mt-2" style={{ position: "relative" }}>
      <label>New Password</label>
      <input
        type={showPassword ? "text" : "password"}
        className={`form-control ${editValues.password && (
          !pwStrength.length ||
          !pwStrength.upper ||
          !pwStrength.lower ||
          !pwStrength.digit ||
          !pwStrength.hasSpecial
        ) ? "is-invalid" : ""}`}
        value={editValues.password}
        onChange={e => setEditValues(v => ({ ...v, password: e.target.value }))}
        autoComplete="new-password"
        style={{ paddingRight: 40 }}
        placeholder="Leave blank to keep current password"
      />
      <button
        type="button"
        onClick={() => setShowPassword(s => !s)}
        style={{
          position: "absolute",
          right: 10,
          top: "55%",
          transform: "translateY(-50%)",
          border: "none",
          background: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
          zIndex: 2
        }}
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? "🙈" : "👁️"}
      </button>
      <ul className="mt-2 mb-0 pl-4" style={{ fontSize: 13, color: "#777" }}>
        {passwordRules.map((rule) => (
          <li key={rule.key} style={{
            color: pwStrength[rule.key as keyof typeof pwStrength] ? "#51c775" : "#aaa"
          }}>
            {rule.text}
          </li>
        ))}
      </ul>
    </div>
    <div className="form-group mt-2" style={{ position: "relative" }}>
      <label>Confirm Password</label>
      <input
        type={showPassword ? "text" : "password"}
        className={`form-control ${!pwMatch && editValues.confirmPassword ? "is-invalid" : ""}`}
        value={editValues.confirmPassword}
        onChange={e => setEditValues(v => ({ ...v, confirmPassword: e.target.value }))}
        autoComplete="new-password"
        style={{ paddingRight: 40 }}
        placeholder="Confirm new password"
      />
      {!pwMatch && editValues.confirmPassword && (
        <div className="invalid-feedback" style={{ display: "block" }}>
          Passwords do not match.
        </div>
      )}
    </div>
  </div>
)}



          {/* LINKED PLAYERS */}
          {profile && profile.role !== "player" && (
            <div
              className="card card-body mb-4"
              style={{
                background: "#fffbe6",
                borderLeft: "5px solid #ffd766",
                borderRadius: 14
              }}>
              <h5 style={{ color: "#ffb800" }}>Linked Players</h5>
              {linkedPlayerNames.length ? (
                <div className="mb-2 d-flex flex-wrap">
                  {linkedPlayerNames.map((n, i) => (
                    <span key={i} className="badge badge-pill mr-2 mb-2" style={{
                      background: "#6ecbe6", color: "#215",
                      fontSize: 14, padding: "8px 12px"
                    }}>
                      {n}
                      <button
                        className="btn btn-sm btn-danger ml-2"
                        style={{ padding: "2px 8px", fontSize: 12 }}
                        onClick={async () => {
                          const playerUid = linkedPlayers[i];
                          await updateDocumentFields("users", firebaseUser.uid, {
                            linkedPlayers: linkedPlayers.filter(uid => uid !== playerUid)
                          });
                          setLinkedPlayers(linkedPlayers.filter(uid => uid !== playerUid));
                          await removeFromArrayInDocument("players", playerUid, "linkedUsers", firebaseUser.uid);
                        }}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No linked players yet.</p>
              )}
              <button className="btn btn-outline-primary mt-2" onClick={() => setShowEditLinked(v => !v)}>
                {showEditLinked ? "Cancel" : "Edit Linked Players"}
              </button>
            </div>
          )}

          {/* ADD LINKED PLAYERS */}
          {showEditLinked && profile && profile.role !== "player" && (
            <div className="card card-body mb-3" style={{ background: "#f1f7ff", borderRadius: 12 }}>
              <div className="form-group">
                <label>Select a player to link:</label>
                <select
                  className="form-control"
                  value={selectedPlayerUid}
                  onChange={e => setSelectedPlayerUid(e.target.value)}
                >
                  <option value="">-- Select a player --</option>
                  {allPlayers
                    .filter(p => !linkedPlayers.includes(p.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.id})
                      </option>
                    ))}
                </select>
              </div>
              <button
                className="btn btn-success mt-2"
                disabled={!selectedPlayerUid}
                onClick={async () => {
                  if (!selectedPlayerUid) return;
                  await addToArrayInDocument("users", firebaseUser.uid, "linkedPlayers", selectedPlayerUid);
                  setLinkedPlayers([...linkedPlayers, selectedPlayerUid]);
                  setSelectedPlayerUid("");
                  await addToArrayInDocument("players", selectedPlayerUid, "linkedUsers", firebaseUser.uid);
                }}
              >
                Add Linked Player
              </button>
            </div>
          )}

          {/* ======= MY SIGNUPS ======= */}
          <div className="card p-4 shadow-sm mb-4" style={{
            background: "linear-gradient(90deg,#f6ffed 0,#e3f6fc 100%)",
            border: "none", borderRadius: 14
          }}>
            <h4 className="mb-3" style={{ color: "#0a8754" }}>My Tournament Signups</h4>
            {loadingSignups ? (
              <div>Loading tournaments...</div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {tournaments.length === 0 && (
                  <div>No upcoming tournaments found.</div>
                )}
                {tournaments.map((t) => {
                  const signupStatus = mySignups[t.id];
                  const label = signupStatus?.signedUp
                    ? availabilityLabel(signupStatus?.availability)
                    : "Not Signed Up";
                  return (
                    <div key={t.id}
                      className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2"
                      style={{ borderColor: "#dde8ef" }}
                    >
                      <div>
                        <Link to={`/tournament/${t.id}`}
                          style={{ textDecoration: "none", fontWeight: 500, color: "#2e3a59" }}>
                          <span role="img" aria-label="calendar" style={{ fontSize: 18, marginRight: 6 }}>📅</span>
                          {t.eventName}
                        </Link>
                        <div style={{ fontSize: 13, color: "#7fa2b2" }}>{t.date}</div>
                      </div>
                      <span
                        className="badge badge-pill"
                        style={{
                          background: statusColor(label),
                          color: "#fff",
                          fontSize: 15,
                          padding: "8px 20px"
                        }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
    </div>
  );
};


export default ProfileScreen;
