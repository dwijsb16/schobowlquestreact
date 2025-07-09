import React from "react";
import { Tournament } from "../types/event"; // adjust path if needed

async function createCalendarEvent(tournamentData: Tournament) {
    try {
      const response = await fetch("https://us-central1-questsb-website.cloudfunctions.net/addToCalendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: tournamentData.eventName,
          description: `${tournamentData.rules}\n${tournamentData.additionalInfo}`,
          location: tournamentData.location,
          start: `${tournamentData.date}T${tournamentData.startTime}`,
          end: `${tournamentData.date}T${tournamentData.endTime || tournamentData.startTime}`,
        }),
      });
  
      if (!response.ok) throw new Error("Failed to add event to calendar");
  
      const data = await response.json();
      alert(`Event created! ID: ${data.eventId}`);
    } catch (error) {
      console.error("Calendar error:", error);
      alert("Failed to add event to calendar.");
    }
  }
  export default createCalendarEvent;
  