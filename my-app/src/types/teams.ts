export type TeamDoc = {
    tournamentId: string;               // ID of the tournament
    name: string;                       // e.g., "Team A"
    players: {
      signupId: string;                 // ID of the signup document (not playerId!)
      isCaptain: boolean;
    }[];
  };
  