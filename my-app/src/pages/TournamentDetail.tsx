import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth } from "../.firebase/utils/firebase";
import { useNavigate } from "react-router-dom";
import { db } from "../.firebase/utils/firebase";

import {
  getCollection,
  getDocumentById,
  addToArrayInDocument,
  removeFromArrayInDocument,
  updateDocumentFields,
} from "../hooks/firestore";

const ProfileScreen: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("player");
  const [linkedPlayers, setLinkedPlayers] = useState<string[]>([]);
  const [editProfile, setEditProfile] = useState(false);
  const [showEditLinked, setShowEditLinked] = useState(false);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkedPlayerNames, setLinkedPlayerNames] = useState<string[]>([]);
  const navigate = useNavigate();

  // Auth on mount
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

  // Fetch all players for the dropdown (from players collection)
  useEffect(() => {
    if (showEditLinked && profile && profile.role !== "player") {
      getCollection<any>("players").then((players) => {
        setAllPlayers(players);
      });
    }
  }, [showEditLinked, profile]);

  // Always fetch names for linked players when linkedPlayers changes
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

  // ========== PROFILE FORM (LOCKED IN) ==========
  if (needsProfile) {
    return (
      <div className="container mt-5">
        <h2>Create Your Profile</h2>
        <form
          onSubmit={async (e) => {
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
          }}
        >
          <div className="form-group">
            <label>First Name</label>
            <input
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="player">Player</option>
              <option value="parent">Parent</option>
              <option value="coach">Coach</option>
            </select>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button className="btn btn-success mt-3" type="submit">
            Create Profile
          </button>
        </form>
      </div>
    );
  }

  // ========== PROFILE MAIN ==========
  return (
    <div className="container mt-5">
      <h2>
        Welcome, {profile ? `${profile.firstName} ${profile.lastName}` : ""}!
      </h2>

      <button className="btn btn-link float-right" onClick={() => setEditProfile((v) => !v)}>
        {editProfile ? "Cancel" : "Edit Profile"}
      </button>

      {editProfile && (
        <form
          className="mb-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await updateDocumentFields("users", firebaseUser.uid, {
                firstName,
                lastName,
                role,
              });
              setProfile({ ...profile, firstName, lastName, role });
              setEditProfile(false);
            } catch (err: any) {
              alert("Error updating profile.");
            }
          }}
        >
          <div className="form-group">
            <label>First Name</label>
            <input
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="player">Player</option>
              <option value="parent">Parent</option>
              <option value="coach">Coach</option>
            </select>
          </div>
          <button className="btn btn-primary mt-2" type="submit">
            Save
          </button>
        </form>
      )}

      {/* LINKED PLAYERS - Only show for parent/coach */}
      {profile && profile.role !== "player" && (
        <div className="mb-4">
          <h5>Linked Players:</h5>
          {linkedPlayerNames.length ? (
            <ul>
              {linkedPlayerNames.map((n, i) => (
                <li key={i}>
                  {n}
                  <button
                    className="btn btn-sm btn-danger ml-2"
                    onClick={async () => {
                      const playerUid = linkedPlayers[i];
                      // Remove player from user's linkedPlayers
                      await removeFromArrayInDocument("users", firebaseUser.uid, "linkedPlayers", playerUid);
                      // Remove user from player's linkedUsers
                      await removeFromArrayInDocument("players", playerUid, "linkedUsers", firebaseUser.uid);
                      setLinkedPlayers(linkedPlayers.filter((uid) => uid !== playerUid));
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No linked players yet.</p>
          )}
          <button
            className="btn btn-outline-primary mt-2"
            onClick={() => setShowEditLinked((v) => !v)}
          >
            {showEditLinked ? "Cancel" : "Edit Linked Players"}
          </button>
        </div>
      )}

      {/* ADD LINKED PLAYERS */}
      {showEditLinked && profile && profile.role !== "player" && (
        <div className="card card-body mb-3">
          <div className="form-group">
            <label>Select a player to link:</label>
            <select
              className="form-control"
              value={selectedPlayerUid}
              onChange={(e) => setSelectedPlayerUid(e.target.value)}
            >
              <option value="">-- Select a player --</option>
              {allPlayers
                .filter((p) => !linkedPlayers.includes(p.id)) // Use player doc id
                .map((p) => (
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
              // Add to user's linkedPlayers
              await addToArrayInDocument("users", firebaseUser.uid, "linkedPlayers", selectedPlayerUid);
              // Add to player's linkedUsers
              await addToArrayInDocument("players", selectedPlayerUid, "linkedUsers", firebaseUser.uid);
              setLinkedPlayers([...linkedPlayers, selectedPlayerUid]);
              setSelectedPlayerUid("");
            }}
          >
            Add Linked Player
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
