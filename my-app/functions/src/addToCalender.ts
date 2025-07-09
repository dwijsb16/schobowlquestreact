import * as functions from 'firebase-functions';
import { google } from 'googleapis';
import cors from 'cors';
import serviceAccount from '../keys/quest-scho-bowl-app-463323-05b35b987292.json';

const calendarId = 'questsbclub@gmail.com';

const auth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const corsHandler = cors({ origin: true });

export const addToCalendar = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Only POST allowed');
      return;
    }

    try {
      const { summary, description, location, start, end } = req.body;

      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary,
          location,
          description,
          start: {
            dateTime: start,
            timeZone: 'America/Chicago',
          },
          end: {
            dateTime: end,
            timeZone: 'America/Chicago',
          },
        },
      });

      res.status(200).json({ success: true, eventId: response.data.id });
    } catch (err) {
      console.error(err);
      res.status(500).send('Failed to add event');
    }
  });
});
