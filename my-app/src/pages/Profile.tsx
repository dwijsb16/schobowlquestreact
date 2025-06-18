import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { auth, db } from "../.firebase/utils/firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { User } from "../types/user";
import { Player } from "../types/player";

const ProfileScreen: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [userId, setUserId] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkedPlayer, setLinkedPlayer] = useState<string | null>(null);
  const [linkedUsers, setLinkedUsers] = useState<string[]>([]);
  const [linkedUserNames, setLinkedUserNames] = useState<string[]>([]);
  const [isPlayer, setIsPlayer] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userDocs = await getDocs(collection(db, "users"));
        userDocs.forEach(async (docSnap) => {
          const data = docSnap.data() as User;
          if (data.uid === user.uid) {
            setFirstName(data.firstName);
            if (data.role === "player") {
              setIsPlayer(true);
              const playerDocs = await getDocs(collection(db, "players"));
              playerDocs.forEach(async (playerDoc) => {
                const pdata = playerDoc.data() as Player;
                if (pdata.uid === user.uid) {
                  const linked = pdata.linkedUsers || [];
                  setLinkedUsers(linked);
                  fetchLinkedUserNames(linked);
                }
              });
            } else {
              setLinkedPlayer(data.linkedPlayer || null);
              setIsPlayer(false);
            }
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLinkedUserNames = async (uids: string[]) => {
    const names: string[] = [];
    const userCollection = await getDocs(collection(db, "users"));
    userCollection.forEach((docSnap) => {
      const data = docSnap.data() as User;
      if (uids.includes(data.uid)) {
        names.push(`${data.firstName} ${data.lastName}`);
      }
    });
    setLinkedUserNames(names);
  };

  const handleLinkClick = async () => {
    setLinking(true);
    try {
      const snapshot = await getDocs(collection(db, "players"));
      const playerList: string[] = snapshot.docs.map((doc) => doc.data().firstName + " " + doc.data().lastName);
      setPlayers(playerList);
    } catch (err) {
      console.error("Error fetching players:", err);
    }
  };

  const handleSubmit = async () => {
    try {
      const playerSnapshot = await getDocs(collection(db, "players"));
      let oldPlayerId = null;

      const userDocs = await getDocs(collection(db, "users"));
      for (const uDoc of userDocs.docs) {
        const uData = uDoc.data() as User;
        if (uData.uid === userId) {
          if (uData.linkedPlayer) {
            alert("You can only link to one player.");
            return;
          }
          oldPlayerId = uData.linkedPlayer;
          const userRef = doc(db, "users", uDoc.id);
          await updateDoc(userRef, { linkedPlayer: selectedPlayer });
          setLinkedPlayer(selectedPlayer);
          break;
        }
      }

      for (const docSnap of playerSnapshot.docs) {
        const data = docSnap.data() as Player;
        const fullName = `${data.firstName} ${data.lastName}`;
        const playerRef = doc(db, "players", docSnap.id);

        if (fullName === selectedPlayer) {
          if ((data.linkedUsers || []).includes(userId)) {
            alert("You already linked to this player.");
            return;
          }
          await updateDoc(playerRef, {
            linkedUsers: arrayUnion(userId),
          });
          alert("Player linked successfully!");
        }

        if (fullName === oldPlayerId && oldPlayerId !== selectedPlayer) {
          await updateDoc(playerRef, {
            linkedUsers: arrayRemove(userId),
          });
        }
      }
    } catch (err) {
      console.error("Error linking player:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: "90px" }}>
        <h2>Welcome, {firstName}!</h2>
        <div className="mt-4">
          <p>You're logged in.</p>

          {linkedPlayer && <p>🔗 Account is linked to: <strong>{linkedPlayer}</strong></p>}

          {isPlayer && linkedUserNames.length > 0 && (
            <>
              <p>👥 Users linked to your player account:</p>
              <ul>
                {linkedUserNames.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            </>
          )}

          {!isPlayer && (
            <>
              <button className="btn btn-outline-primary" onClick={handleLinkClick}>
                {linkedPlayer ? "Change linked player" : "Link your account to a player"}
              </button>

              {linking && (
                <div className="mt-3">
                  <select
                    className="form-select mb-2"
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                  >
                    <option value="" disabled>Select a player</option>
                    {players.map((player, index) => (
                      <option key={index} value={player}>{player}</option>
                    ))}
                  </select>
                  <button className="btn btn-success" onClick={handleSubmit}>Submit</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfileScreen;
