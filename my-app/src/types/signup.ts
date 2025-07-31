import { FieldValue, Timestamp } from "firebase/firestore";

export interface Signup {
  tournamentId: string;
  userId: string;
  playerId: string;
  availability: string;
  carpool: string;
  parentAttending: boolean;
  canModerate: boolean;
  canScorekeep: boolean;
  additionalInfo?: string;
  timestamp: FieldValue | Timestamp; // <-- serverTimestamp on write, Timestamp on read
  startTime?: string;
  endTime?: string;
  driveCapacity?: string;
}
