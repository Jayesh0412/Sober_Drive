# RTO Alcohol Detection — Dashboard (Web)
This is a simple RTO dashboard that listens to a Firebase Realtime Database path (`/alerts`) and shows alerts raised by your hardware (alcohol detection + engine lock system).

## Files
- `index.html` — dashboard UI (static)
- `styles.css` — styling
- `app.js` — Firebase logic & UI glue
- `sample_data.json` — example dataset you can import in Firebase for testing

## Setup (step-by-step)
1. Create a Firebase project at https://console.firebase.google.com/.
2. In the project, go to **Realtime Database** → Create database → Start in **locked mode** (recommended) or test mode for development.
3. Copy your project's realtime `databaseURL` and web config from Project Settings → General → Your apps (add a Web app if needed).
4. Open `app.js` and replace the `firebaseConfig` object with your project's config (apiKey, authDomain, databaseURL, projectId, etc).
5. (Optional but recommended) Set database rules to restrict writes to authenticated sources or use server-side Admin SDK for hardware to push results securely.
   Example quick rules for development (NOT FOR PRODUCTION):
   ```
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
6. Run: open `index.html` in any modern browser. The page will connect to your realtime database and render alerts under `/alerts`.

## How your hardware should send data
Your microcontroller (ESP8266/ESP32/Arduino+GSM) or Raspberry Pi should POST JSON to:
`https://<PROJECT>.firebaseio.com/alerts.json`
Example payload:
```json
{
  "driver_name": "Rahul Kumar",
  "licence": "DL-01-20240012345",
  "vehicle_no": "DL1AB1234",
  "alcohol_level": 0.45,
  "threshold": 0.25,
  "location": "New Delhi, Ring Road",
  "timestamp": 1690000000000,
  "device_id": "ARDUINO-01",
  "engine_locked": true
}
```

## Security notes
- For production, do NOT use public `.write` rules. Instead:
  - Use Firebase Authentication + tokens
  - Or send data from hardware to a secure server you control, and use Firebase Admin SDK (server-side) to write to the DB.
- Consider encrypting sensitive data in transit.

## Extras & suggestions
- Add authentication to dashboard (Firebase Auth).
- Use Cloud Functions to validate and enrich incoming data (reverse geocoding, SMS alerts).
- Store historical records in Firestore if more structured queries are needed.

## Development / testing
You can import `sample_data.json` into Realtime Database using the import tool in Firebase console or push items via curl.

