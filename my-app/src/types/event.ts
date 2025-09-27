export interface Tournament {
    teamsPublished: boolean;
    eventName: string;
    eventType: "extra_practice" | "match_play" | "tournament";
    status: "tentative" | "confirmed" | "cancelled";
    date: string;
    startTime: string;
    endTime?: string;
    rsvpDate?: string;
    rsvpTime?: string;
    rules?: string;
    location: string;
    shirtColor?: string;
    additionalInfo?: string;
    needsModerators?: boolean;
    googleEventID?: string; // ID for Google Calendar event
  }