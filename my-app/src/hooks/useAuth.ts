// import { useState, useEffect, createContext, useContext } from 'react';
// import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
// import db from '../.firebase/utils/firebase.js'; 


// interface User {
//   id: string;
//   email: string;
//   name: string;
//   role: 'coach' | 'player';
// }

// interface AuthContextType {
//   user: User | null;
//   isAuthenticated: boolean;
//   isCoach: boolean;
//   isPlayer: boolean;
// }
// const defaultAuthContext: AuthContextType = {
//     user: null,
//     isAuthenticated: false,
//     isCoach: false,
//     isPlayer: false
//   };
  
//   const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// export const useAuth = () => {
//   return useContext(AuthContext)!;
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const auth = getAuth();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (firebaseUser) {
//         const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
//         if (userDoc.exists()) {
//           const userData = userDoc.data();
//           setUser({
//             id: firebaseUser.uid,
//             email: firebaseUser.email!,
//             name: userData.name,
//             role: /*userData.role later*/ 'coach'
//           });
//         }
//       } else {
//         setUser(null);
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   const value: AuthContextType = {
//     user,
//     isAuthenticated: !!user,
//     isCoach: user?.role === 'coach',
//     isPlayer: user?.role === 'player'
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };
import { useState, useEffect } from 'react';
import { User, AuthContextType } from '../types/auth_types'; // Adjust the import path as necessary

export const useAuth = (): AuthContextType => {
  // Define mock user outside for consistent access
  const mockCoachUser: User = {
    id: 'test-coach-123',
    email: 'test.coach@example.com',
    name: 'Test Coach',
    role: 'coach'
  };

  const [user, setUser] = useState<User | null>(mockCoachUser); // Initialize with mock user

  const login = async (email: string, password: string) => {
    // For testing, always set to mock user
    setUser(mockCoachUser);
    console.log('Login attempted - Setting mock user', { email, password });
  };

  const logout = () => {
    setUser(mockCoachUser); // Keep mock user even after logout for testing
  };

  const authValues = {
    user: mockCoachUser, // Always use mock user
    login,
    logout,
    isAuthenticated: true, // Always authenticated
    isCoach: true // Always a coach
  };

  // Debug logging
  console.debug('[useAuth] Current auth state:', {
    user: mockCoachUser,
    isAuthenticated: true,
    isCoach: true,
    timestamp: new Date().toISOString()
  });

  return authValues;
};