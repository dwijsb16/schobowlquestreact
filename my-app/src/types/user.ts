export type UserRole = 'player' | 'parent' | 'coach'|'alumni'|'assistant coach';

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  // For non-players: which player(s) are they linked to?
  linkedPlayers?: string[]; // array of Player ID
  suburb?: string;
}
