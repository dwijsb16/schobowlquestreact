export interface Player {
  uid: string; // doc ID in Firestore
  firstName: string;
  lastName: string;
  grade: string;
  // Which user accounts are associated with this player?
  linkedUsers: string[]; // array of User UIDs (parents, self, etc)
}
