# CUFinder

A lost-and-found web and mobile app for Chulalongkorn University, built as part of the Application Development course (2190512).

**Live app:** https://cufinder.vercel.app

> **Note on the backend repo:** The backend is deployed from a separate private repository. The original repo accumulated too many commits with credentials and config changes during development, so we kept the deployed version separate to avoid exposing sensitive keys.

---

## What it does

Students and staff can report lost or found items on campus. Campus admins (security office, library, etc.) can manage items held at their location and mark them as claimed or disposed.

- Login with a CU email (`@chula.ac.th` or `@student.chula.ac.th`) via Google
- Post a lost item — photo, description, category, last-seen location, date
- Post a found item — photo, description, where found, where it's currently held
- Browse and filter listings by category, location, and date range
- Admin dashboard for location staff and web admins

## Project structure

```
cufinder/
├── frontend/    # React + TypeScript web app (Vite)
├── backend/     # Python Flask REST API
├── mobile/      # Expo React Native mobile app
└── docs/        # API contract and project proposal
```

## Tech stack

- **Web frontend:** React + TypeScript, Vite
- **Mobile:** Expo (React Native)
- **Backend:** Python, Flask
- **Database:** MongoDB, GridFS for image storage
- **Auth:** Google OAuth restricted to CU domain

## Running locally

You need **two terminals** running at the same time: one for the backend, one for the frontend.

### 1. Backend (from `backend/`)

> **Python version:** Requires Python 3.11–3.13. Python 3.14+ is not supported yet due to `pydantic-core`.

```bash
python3.11 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and fill in the required values — at minimum `MONGODB_URI` (MongoDB Atlas connection string), `SESSION_SECRET`, and your Google OAuth credentials.

```bash
flask --app app run --debug --port 5001
```

### 2. Web frontend (from `frontend/`)

```bash
npm install
cp .env.example .env.local
```

In `.env.local`, set `VITE_USE_MOCK=false` to connect to the real backend.

```bash
npm run dev
```

Open http://localhost:5173. The Vite dev proxy forwards `/api/*` to the Flask backend on port 5001.

### Mobile app (from `mobile/`)

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone. The mobile app connects to the deployed backend at `cufinder-backend.onrender.com` by default, so no local backend is required.

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list. The key ones are `MONGODB_URI`, `SESSION_SECRET`, and Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`).
