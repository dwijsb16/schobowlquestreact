import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { setDoc, collection, doc, getDocs, getDoc, query, orderBy } from "firebase/firestore";
import { auth, db } from "../.firebase/utils/firebase";
import { updatePassword } from "firebase/auth";
import Footer from "../components/footer";

import {
  getCollection,
  getDocumentById,
  addToArrayInDocument,
  removeFromArrayInDocument,
  updateDocumentFields,
} from "../hooks/firestore";
import { Link } from "react-router-dom";
import { Password } from "@mui/icons-material";

const RED = "#DF2E38";
const DARK_RED = "#B71C1C";
const BLACK = "#232323";
const GREY = "#858585";
const LIGHT_GREY = "#F7F7F7";
const WHITE = "#fff";
const GREEN = "#51c775";
const YELLOW = "#FFD93D";
const BADGE_GREY = "#EAECF0";

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
      return GREEN;
    case "Not Attending":
      return RED;
    case "Leaving Early":
    case "Arriving Late":
    case "Late Arrival & Early Departure":
      return YELLOW;
    default:
      return GREY;
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
    // 🔥 ALL HOOKS AT THE TOP, NOTHING ELSE BEFORE THIS
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
    const [suburb, setSuburb] = useState("");
  
    const [tournaments, setTournaments] = useState<TournamentCard[]>([]);
    const [mySignups, setMySignups] = useState<{
      [tournId: string]: { signedUp: boolean; availability?: string }
    }>({});
    const [loadingSignups, setLoadingSignups] = useState(false);

const pwStrength = checkPasswordStrength(editValues.password);
useEffect(() => {
  setPwMatch(
    editValues.confirmPassword === "" ||
    editValues.password === editValues.confirmPassword
  );
}, [editValues.password, editValues.confirmPassword]);
  // For "My Signups"

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
          setSuburb(userDoc.suburb || "");
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
  // Fetch all players for dropdown if non-player (coach/parent)
useEffect(() => {
  if (profile && profile.role !== "player") {
    getCollection<any>("players").then(players => setAllPlayers(players));
  }
}, [profile]);

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
          out.push(`${playerDoc.firstName} ${playerDoc.lastName}`);
        }
      }
      setLinkedPlayerNames(out);
    };
    fetchNames();
  }, [linkedPlayers]);
  const effectiveLinkedPlayers =
  profile?.role === "coach"
    ? (linkedPlayers[0] ? [linkedPlayers[0]] : [])
    : linkedPlayers;
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
              (profile && profile.role === "player" && data.playerId === firebaseUser.uid) || (profile.role !== "player" && effectiveLinkedPlayers.includes(data.playerId))

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
  if (!profile?.suburb) {
    return (
      <div className="container mt-5">
        <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: 500, background: "#f7fafd" }}>
          <h2 style={{ color: "#4285f4" }}>Complete Your Profile</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!suburb.trim()) return setError("Please enter your suburb.");
            try {
              await updateDocumentFields("users", firebaseUser.uid, { suburb });
              setProfile({ ...profile, suburb });
            } catch (err) {
              setError("Error saving suburb.");
            }
          }}>
            <div className="form-group">
              <label>Suburb:</label>
              <input
                className="form-control"
                value={suburb}
                onChange={e => setSuburb(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger mt-2">{error}</div>}
            <button className="btn btn-success mt-3 w-100" type="submit">Save</button>
          </form>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div style={{textAlign:"center", marginTop:40, color:"#DF2E38", fontWeight:600, fontSize:22}}>
        Loading profile...
      </div>
    );
  }
  // Now profile is guaranteed non-null



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
                suburb,
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
  <label>Suburb:</label>
  <input
    className="form-control"
    value={suburb}
    onChange={e => setSuburb(e.target.value)}
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
  <div
  style={{
    background: "linear-gradient(180deg, #fff 0%, #f7f7f7 60%, #fff6f7 100%)",
    width: "100vw",
    overflowX: "hidden",
  }}
>
<div
  className="mb-4"
  style={{
    width: "100%",
    maxWidth: 820,
    margin: "0 auto 36px auto",
    borderRadius: 26,
    padding: "34px 0 28px 0",
    boxShadow: "0 4px 24px #e9bfc33a, 0 1.5px 8px #ffd6e150",
    textAlign: "center",
    background: "#fff",
    position: "relative",
    border: "2.5px solid #ffe5ea",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  }}
>
  <div
    style={{
      fontWeight: 700,
      fontSize: 38,
      color: "#DF2E38",
      letterSpacing: 0.5,
      lineHeight: 1.14,
      marginBottom: 5,
    }}
  >
    Welcome, {profile?.firstName}
  </div>
  <div
    style={{
      fontSize: 18,
      color: "#8a8a8a",
      fontWeight: 500,
      letterSpacing: 0.2,
    }}
  >
    Glad to see you back in your profile.
  </div>
</div>



  <div className="container-fluid px-0" style={{ maxWidth: 1600, margin: "0 auto" }}>
    <div className="row gx-5 gy-5 px-1 px-lg-4 py-4">
      {/* Profile Left Section */}
      <div className="col-12 col-lg-5">
        {/* Profile Card */}
        <div
          className="shadow"
          style={{
            borderRadius: 28,
            background: "linear-gradient(120deg,#fff 70%,#ffebee 100%)",
            border: "2.5px solid #DF2E3811",
            boxShadow: "0 6px 24px #ffd6e133",
            minHeight: 260,
            marginBottom: 36,
            padding: 0,
          }}
        >
          <div className="p-4 d-flex align-items-center">
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#DF2E3840 0,#DF2E3815 100%)",
                color: "#DF2E38",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 34,
                marginRight: 26,
                border: "3px solid #DF2E3822",
                letterSpacing: 1,
              }}
            >
              {(profile?.firstName?.[0] || "") + (profile?.lastName?.[0] || "")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 27, color: "#232323" }}>
                {profile?.firstName} {profile?.lastName}
              </div>
              <span
                className="badge"
                style={{
                  background: "#DF2E38",
                  color: "#fff",
                  borderRadius: 14,
                  fontWeight: 600,
                  fontSize: 15,
                  letterSpacing: 1,
                  padding: "7px 18px",
                  marginTop: 7,
                }}
              >
                {profile?.role
                  ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                  : ""}
              </span>
              <div style={{ color: "#555", fontSize: 15, marginTop: 8 }}>
                <span>{profile?.email}</span>
              </div>
              <div className="mt-3">
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => setEditProfile(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
          {/* Edit Profile Inline Panel */}
          {editProfile && (
            <div className="px-4 pt-0 pb-3">
              {/* Edit fields, same as your previous code, with new styles */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
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
                      suburb,
                      role: editValues.role

                    });
                    setProfile({ ...profile, ...editValues, suburb, password: undefined, confirmPassword: undefined });
                    setEditProfile(false);
                  } catch (err: any) {
                    setEditError("Error saving changes. Try again.");
                  }
                  setSavingEdit(false);
                }}
                
              >
                <div className="row mb-2">
                  <div className="col">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="First Name"
                      value={editValues.firstName}
                      onChange={(e) =>
                        setEditValues((v) => ({
                          ...v,
                          firstName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="col">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Last Name"
                      value={editValues.lastName}
                      onChange={(e) =>
                        setEditValues((v) => ({
                          ...v,
                          lastName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="mb-2">
  <input
    type="text"
    className="form-control"
    placeholder="Suburb"
    value={suburb}
    onChange={(e) => setSuburb(e.target.value)}
    required
  />
</div>

                <div className="mb-2">
                  <select
                    className="form-select"
                    value={editValues.role}
                    onChange={(e) =>
                      setEditValues((v) => ({
                        ...v,
                        role: e.target.value,
                      }))
                    }
                  >
                    <option value="player">Player</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                <div className="mb-2" style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="New Password"
                    value={editValues.password}
                    onChange={(e) =>
                      setEditValues((v) => ({
                        ...v,
                        password: e.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((s) => !s)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: 7,
                      border: "none",
                      background: "none",
                      color: "#B71C1C",
                      fontWeight: 700,
                      fontSize: 22,
                      cursor: "pointer",
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <div className="mb-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Confirm Password"
                    value={editValues.confirmPassword}
                    onChange={(e) =>
                      setEditValues((v) => ({
                        ...v,
                        confirmPassword: e.target.value,
                      }))
                    }
                    autoComplete="new-password"
                  />
                </div>
                {/* Password rule checks */}
                <ul
                  className="mt-2 mb-1 ps-4"
                  style={{
                    fontSize: 13,
                    color: "#888",
                    listStyle: "disc inside",
                  }}
                >
                  {passwordRules.map((rule) => (
                    <li
                      key={rule.key}
                      style={{
                        color: checkPasswordStrength(editValues.password)[
                          rule.key as keyof typeof checkPasswordStrength
                        ]
                          ? "#51c775"
                          : "#aaa",
                      }}
                    >
                      {rule.text}
                    </li>
                  ))}
                </ul>
                {editError && (
                  <div className="alert alert-danger mt-1 py-1">
                    {editError}
                  </div>
                )}
                <div className="d-flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm"
                    disabled={savingEdit}
                  >
                    {savingEdit ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setEditProfile(false)}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        {/* Linked Players */}
        {profile && profile.role === "coach" && (
  <div
    className="mb-4"
    style={{
      background: "#fff",
      borderRadius: 20,
      padding: "22px 26px 18px 26px",
      border: "2px solid #f5d7dc",
      marginTop: 4,
      boxShadow: "0 1.5px 8px #ffd6e144",
    }}
  >
    <div
      style={{
        fontWeight: 700,
        color: "#DF2E38",
        letterSpacing: 1,
        fontSize: 17,
        marginBottom: 7,
      }}
    >
      Favorite Player
    </div>
    <div style={{ color: "#888", fontSize: 15, marginBottom: 10 }}>
      Coaches are automatically linked to all players for registration,<br />
      but you may select a <b>favorite player</b> below. Their signup status will show up in your dashboard.
    </div>
    <div className="d-flex align-items-center gap-2">
      <select
        className="form-select"
        value={linkedPlayers[0] || ""}
        style={{ width: 240, marginRight: 16 }}
        onChange={async e => {
          const favUid = e.target.value;
          await updateDocumentFields("users", firebaseUser.uid, { linkedPlayers: favUid ? [favUid] : [] });
          setLinkedPlayers(favUid ? [favUid] : []);
        }}
      >
        <option value="">-- Select favorite player --</option>
        {allPlayers.map(p => (
          <option key={p.id} value={p.id}>
            {p.firstName} {p.lastName} 
          </option>
        ))}
      </select>
      {linkedPlayers[0] && (
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={async () => {
            await updateDocumentFields("users", firebaseUser.uid, { linkedPlayers: [] });
            setLinkedPlayers([]);
          }}
        >
          Remove Favorite
        </button>
      )}
    </div>
    {linkedPlayers[0] && (
      <div style={{ marginTop: 8, color: "#B71C1C", fontWeight: 600, fontSize: 15 }}>
        Favorite: {linkedPlayerNames[0]}
      </div>
    )}
  </div>
)}

      </div>
      {profile && profile.role === "parent" && (
  <div
  className="mb-4"
  style={{
    background: "#fff",
    borderRadius: 20,
    padding: "22px 26px 18px 26px",
    border: "2.5px solid #f5d7dc",
    marginTop: 4,
    boxShadow: "0 4px 24px #ffd6e133, 0 1.5px 8px #ffd6e150",
    maxWidth: 500,
    marginLeft: "auto",
    marginRight: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    position: "relative"
  }}
>
    <div
      style={{
        fontWeight: 700,
        color: "#DF2E38",
        letterSpacing: 1,
        fontSize: 17,
        marginBottom: 7,
      }}
    >
      Linked Players
    </div>
    <div className="d-flex flex-wrap gap-2 mb-2">
      {linkedPlayerNames.length
        ? linkedPlayerNames.map((n, i) => (
            <span
              key={i}
              className="badge"
              style={{
                background: "#ffebee",
                color: "#B71C1C",
                border: "1.2px solid #DF2E3830",
                borderRadius: 16,
                padding: "7px 16px",
                fontWeight: 600,
              }}
            >
              {n}
              <button
                className="btn btn-link btn-sm"
                style={{
                  color: "#DF2E38",
                  marginLeft: 8,
                  fontWeight: 900,
                  fontSize: 16,
                  padding: 0,
                }}
                onClick={async () => {
                  const playerUid = linkedPlayers[i];
                  await updateDocumentFields("users", firebaseUser.uid, {
                    linkedPlayers: linkedPlayers.filter(uid => uid !== playerUid)
                  });
                  setLinkedPlayers(linkedPlayers.filter(uid => uid !== playerUid));
                  await removeFromArrayInDocument("players", playerUid, "linkedUsers", firebaseUser.uid);
                }}
              >
                ×
              </button>
            </span>
          ))
        : (
          <span className="text-muted" style={{ fontSize: 15 }}>
            No linked players yet.
          </span>
        )}
    </div>
    <button
      className="btn btn-outline-danger btn-sm"
      onClick={() => setShowEditLinked((v) => !v)}
    >
      {showEditLinked ? "Cancel" : "Edit Linked Players"}
    </button>
    {/* Edit Linked Players Section */}
    {showEditLinked && profile && profile.role === "parent" && (
      <div className="card card-body mb-3"
        style={{ background: "#f1f7ff", borderRadius: 16, boxShadow: "0 3px 12px #c8dfff22", border: "1.5px solid #e3e6ff" }}>
        <div className="d-flex align-items-end gap-2">
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 500, color: "#2949B8", marginBottom: 5 }}>Select a player to link:</label>
            <select
              className="form-select"
              value={selectedPlayerUid}
              style={{
                border: "1.5px solid #d0e4ff",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 15,
                background: "#fff",
                marginBottom: 0,
              }}
              onChange={e => setSelectedPlayerUid(e.target.value)}
            >
              <option value="">-- Select a player --</option>
              {allPlayers
                .filter(p => !linkedPlayers.includes(p.id))
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} 
                  </option>
                ))}
            </select>
          </div>
          <button
            className="btn btn-danger"
            style={{
              minWidth: 130,
              borderRadius: 10,
              marginLeft: 16,
              fontWeight: 600,
              padding: "9px 0"
            }}
            disabled={!selectedPlayerUid}
            onClick={async () => {
              if (!selectedPlayerUid) return;
              await addToArrayInDocument("users", firebaseUser.uid, "linkedPlayers", selectedPlayerUid);
              setLinkedPlayers([...linkedPlayers, selectedPlayerUid]);
              setSelectedPlayerUid("");
              await addToArrayInDocument("players", selectedPlayerUid, "linkedUsers", firebaseUser.uid);
            }}
          >
            <span style={{ fontSize: 16 }}>➕</span> Add Player
          </button>
        </div>
      </div>
    )}
  </div>
)}


      {/* Main Right Section: Tournament Signups */}
      <div className="col-12 col-lg-7">
        <div
          className="shadow"
          style={{
            borderRadius: 28,
            background: "linear-gradient(120deg,#fff 70%,#fff6f7 100%)",
            border: "2.5px solid #DF2E3811",
            boxShadow: "0 6px 24px #ffd6e133",
            minHeight: 320,
            padding: 0,
          }}
        >
          
          <div className="p-4">
            <h4 style={{ color: "#DF2E38", fontWeight: 700, marginBottom: 18 }}>
              My Tournament Signups
            </h4>
            {loadingSignups ? (
  <div style={{ color: "#aaa", fontSize: 17 }}>Loading tournaments...</div>
) : (
  <div style={{ maxHeight: 340, overflowY: "auto" }}>
    {/* If no player is linked (for non-players), show message */}
    {profile && profile.role !== "player" && effectiveLinkedPlayers.length === 0 ? (
  <div style={{ color: "#B71C1C", fontSize: 16, fontWeight: 600 }}>
    No player linked.
  </div>
) : tournaments.length === 0 ? (
  <div style={{ color: "#B71C1C", fontSize: 16 }}>
    No upcoming tournaments found.
  </div>
) : (
  tournaments.map((t) => {
    const signupStatus = mySignups[t.id];
    const label = signupStatus?.signedUp
      ? availabilityLabel(signupStatus?.availability)
      : "Not Signed Up";
    return (
      <div
        key={t.id}
        className="d-flex align-items-center justify-content-between mb-3 pb-2"
        style={{
          borderBottom: "1px solid #f3d2d9",
        }}
      >
        <div>
          <Link
            to={`/tournament/${t.id}`}
            style={{
              textDecoration: "none",
              fontWeight: 600,
              color: "#232323",
              fontSize: 17,
            }}
          >
            <span
              role="img"
              aria-label="calendar"
              style={{
                fontSize: 18,
                marginRight: 8,
                color: "#DF2E38",
              }}
            >
              📅
            </span>
            {t.eventName}
          </Link>
          <div style={{ fontSize: 13, color: "#888" }}>
            {t.date}
          </div>
        </div>
        <span
          className="badge badge-pill"
          style={{
            background: statusColor(label),
            color: "#fff",
            fontSize: 15,
            padding: "8px 22px",
            fontWeight: 600,
            borderRadius: 13,
            letterSpacing: 1,
          }}
        >
          {label}
        </span>
      </div>
    );
  })
)}
  </div>
)}

          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</div>
  );
};



export default ProfileScreen;
