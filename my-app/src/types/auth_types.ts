export type UserRole = 'player' | 'coach';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isCoach: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}