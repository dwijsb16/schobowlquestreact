import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../.firebase/utils/firebase';
import { User, Player, AuthContextType } from '../types/auth_types';

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [linkedPlayers, setLinkedPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLinkedPlayers([]);
        return;
      }
      try {
        // Fetch user document
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setUser(null);
          setLinkedPlayers([]);
          return;
        }
        const data = userSnap.data();

        // Build the User object
        const loadedUser: User = {
          uid: firebaseUser.uid,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: firebaseUser.email || "",
          role: data.role,
          linkedPlayers: data.linkedPlayers || [],
        };
        setUser(loadedUser);

        // Fetch linked player documents, if any
        if (Array.isArray(loadedUser.linkedPlayers) && loadedUser.linkedPlayers.length > 0) {
          const playerPromises = loadedUser.linkedPlayers.map((playerId: string) =>
            getDoc(doc(db, 'players', playerId))
          );
          const playerSnaps = await Promise.all(playerPromises);
          const players: Player[] = [];
          playerSnaps.forEach((snap) => {
            if (snap.exists()) {
              const pdata = snap.data();
              players.push({
                id: snap.id,
                firstName: pdata.firstName || "",
                lastName: pdata.lastName || "",
                grade: pdata.grade || "",
                linkedUsers: pdata.linkedUsers || [],
              });
            }
          });
          setLinkedPlayers(players);
        } else {
          setLinkedPlayers([]);
        }
      } catch (err) {
        console.error('Error fetching user from Firestore:', err);
        setUser(null);
        setLinkedPlayers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setLinkedPlayers([]);
  };

  return {
    user,
    isAuthenticated: !!user,
    isCoach: user?.role === 'coach' || user?.role === 'parent',
    isPlayer: user?.role === 'player',
    login,
    logout,
    linkedPlayers,
  };
};
