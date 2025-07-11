export interface Tournament {
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
    googleEventID?: string; // ID for Google Calendar event
  }