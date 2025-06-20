// // functions/src/addToCalendar.ts
// import * as functions from "firebase-functions";
// import { google } from "googleapis";
// import serviceAccount from "../keys/quest-scho-bowl-app-463323-05b35b987292.json";

// const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// const calendarId = 'quest-scho-bowl-website@quest-scho-bowl-app-463323.iam.gserviceaccount.com';

// const auth = new google.auth.GoogleAuth({
//   credentials: serviceAccount,
//   scopes: SCOPES,
// });

// export const addToCalendar = functions.https.onRequest(async (req, res) => {
//   if (req.method !== "POST") {
//     res.status(405).send("Only POST allowed");
//     return;
//   }

//   try {
//     const { summary, description, location, start, end } = req.body;
//     const client = await auth.getClient();
//     const calendar = google.calendar({ version: "v3", auth });

//     const response = await calendar.events.insert({
//       calendarId,
//       requestBody: {
//         summary,
//         location,
//         description,
//         start: {
//           dateTime: start,
//           timeZone: "America/Chicago",
//         },
//         end: {
//           dateTime: end,
//           timeZone: "America/Chicago",
//         },
//       },
//     });

//     res.status(200).json({ eventId: response.data.id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Failed to add event");
//   }
// });