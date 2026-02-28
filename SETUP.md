# NeuroSaathi — Setup Guide

## What's New (v5)

1. **NeuroBot → Gemini AI** — Real LLM responses (falls back to static KB if no key)
2. **Test → Results flow fixed** — All 5 tests correctly populate the results dashboard
3. **Accurate Speech Tracking** — Adaptive VAD threshold; pause ratio now speaker-calibrated
4. **Firebase Results History** — Previous results shown in dashboard without retaking exams
5. **Cross-device Doctor Sync** — Doctor names synced to Firestore; visible on all devices

---

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set GEMINI_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — fill Firebase config + set VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

---

## Environment Variables

### Backend `.env`

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | **Recommended** | Get at [aistudio.google.com](https://aistudio.google.com/app/apikey). NeuroBot falls back to static answers without it |
| `API_HOST` | Optional | Default: `0.0.0.0` |
| `API_PORT` | Optional | Default: `8000` |

### Frontend `.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Required | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Required | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Required | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Required | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Required | From Firebase console |
| `VITE_FIREBASE_APP_ID` | Required | From Firebase console |
| `VITE_API_URL` | Required | Backend URL, e.g., `http://localhost:8000` |

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → Enable **Firestore Database** (production or test mode)
3. Add a **Web app** → copy config to `frontend/.env`
4. Enable Firestore rules (minimum for testing):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /doctors/{doctorId} {
      allow read: if true;        // Patients can read doctors
      allow write: if true;       // Frontend syncs doctor data
    }
    match /results/{resultId} {
      allow read, write: if request.auth != null;  // Auth users only
    }
  }
}
```

> **Note:** The app works fully without Firebase — results will only be stored in the backend JSON files, and doctor cross-device sync won't work. Add Firebase for production use.

---

## How Doctor Cross-Device Sync Works

1. Any doctor registers on the backend → their profile is stored in backend JSON
2. When any patient opens the Doctor Selection or Dashboard panel, the frontend:
   - Fetches doctors from backend API
   - Simultaneously **syncs doctor profiles to Firestore**
3. On a different device where the backend may be unavailable, the frontend **falls back to Firestore** to show the doctor list
4. This means: once any patient has loaded the doctor list on one device, all other devices see the same doctors via Firestore

---

## Speech Test — Pause Ratio Accuracy

The pause ratio now uses **adaptive voice activity detection (VAD)**:
- Calibrates to the speaker's voice level in the first ~1 second
- Sets silence threshold at 25% of the speaker's average RMS amplitude
- Excludes mic warmup frames (first 0.5s)
- Fillers/repetitions are tracked separately — NOT added to pause ratio

This means a quiet speaker and a loud speaker get the same meaningful pause ratio relative to their own voice.
