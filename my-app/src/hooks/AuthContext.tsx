import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../.firebase/utils/firebase";
import { User, Player, AuthContextType } from "../types/auth_types";

// 1. Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [linkedPlayers, setLinkedPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLinkedPlayers([]);
        return;
      }

      try {
        // 1. Get user Firestore doc
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setUser(null);
          setLinkedPlayers([]);
          return;
        }
        const userData = userSnap.data();
        // Build User object
        const loadedUser: User = {
          uid: firebaseUser.uid,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: firebaseUser.email || "",
          role: userData.role,
          linkedPlayers: userData.linkedPlayers || [],
        };
        setUser(loadedUser);

        // 2. If user has linked players, load them from players collection
        if (Array.isArray(loadedUser.linkedPlayers) && loadedUser.linkedPlayers.length > 0) {
          // Fetch all linked player docs in parallel
          const playerPromises = loadedUser.linkedPlayers.map((playerId: string) =>
            getDoc(doc(db, "players", playerId))
          );
          const playerSnaps = await Promise.all(playerPromises);
          const players: Player[] = [];
          playerSnaps.forEach((snap) => {
            if (snap.exists()) {
              const data = snap.data();
              players.push({
                id: snap.id,
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                grade: data.grade || "",
                linkedUsers: data.linkedUsers || [],
              });
            }
          });
          setLinkedPlayers(players);
        } else {
          setLinkedPlayers([]);
        }
      } catch (err) {
        console.error("Error loading auth context:", err);
        setUser(null);
        setLinkedPlayers([]);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setLinkedPlayers([]);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isCoach: user?.role === "coach" || user?.role === "parent",
    isPlayer: user?.role === "player",
    login,
    logout,
    linkedPlayers,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Hook for easy usage
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
