import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../.firebase/utils/firebase";
import { User, Player, AuthContextType } from "../types/auth_types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [linkedPlayers, setLinkedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true); // <-- add loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLinkedPlayers([]);
        setLoading(false);
        return;
      }

      try {
        // Get user Firestore doc
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setUser(null);
          setLinkedPlayers([]);
          setLoading(false);
          return;
        }
        const userData = userSnap.data();
        const loadedUser: User = {
          uid: firebaseUser.uid,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: firebaseUser.email || "",
          role: userData.role,
          linkedPlayers: userData.linkedPlayers || [],
        };
        setUser(loadedUser);

        if (Array.isArray(loadedUser.linkedPlayers) && loadedUser.linkedPlayers.length > 0) {
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
        setLoading(false);
      } catch (err) {
        console.error("Error loading auth context:", err);
        setUser(null);
        setLinkedPlayers([]);
        setLoading(false);
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

  const value: AuthContextType & { loading: boolean } = {
    user,
    isAuthenticated: !!user,
    isCoach: user?.role === "coach",
    isPlayer: user?.role === "player",
    isParent: user?.role === "parent",
    login,
    logout,
    linkedPlayers,
    loading, // <-- expose loading state
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType & { loading: boolean } => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
