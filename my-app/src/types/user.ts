  export interface User {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'player' | 'parent' | 'coach';
    grade?: string;
    linkedPlayer?: string;
  }