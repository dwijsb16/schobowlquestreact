// types/auth_types.ts

export type UserRole = 'player' | 'parent' | 'coach';

// This is any authenticated account (player, parent, coach, etc)
export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  linkedPlayers?: string[]; // Player document IDs (if this user is parent/coach)
  }

// This is an entity representing a *student/player* in the system
export interface Player {
  id: string; // Firestore doc ID
  firstName: string;
  lastName: string;
  grade: string;
  linkedUsers: string[]; // User UIDs (accounts linked to this player)
}

// Context Type for React
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isCoach: boolean;
  isPlayer: boolean;
  isParent: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  linkedPlayers: Player[]; // Player records this user is linked to (if applicable)
  loading: boolean; // Loading state for async operations
}
