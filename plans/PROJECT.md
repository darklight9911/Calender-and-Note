# StudyMind — AI Academic Helper

Full-stack academic assistant with two Gemini-powered features: natural-language calendar scheduling and handwritten canvas-note OCR/summarisation.
**Backend**: FastAPI + MongoDB Atlas + Firebase Admin + Gemini AI
**Frontend**: Next.js 16 + Tailwind CSS v4 + Firebase Auth (Google Sign-In)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [External Services Setup](#external-services-setup)
5. [Environment Variables](#environment-variables)
6. [Local Development](#local-development)
7. [Project Structure](#project-structure)
8. [API Reference](#api-reference)
9. [Docker](#docker)
10. [Deployment Notes](#deployment-notes)

---

## Architecture Overview

```
Browser
  │
  ├── Next.js (port 3000)
  │     ├── Firebase Auth  →  Google Sign-In popup / redirect
  │     ├── Context API    →  AuthContext (Firebase user)
  │     └── Axios          →  calls FastAPI with Bearer token
  │
  └── FastAPI (port 8000)
        ├── Firebase Admin  →  verify ID tokens
        ├── Beanie / Motor  →  MongoDB Atlas (ODM + async driver)
        └── Google GenAI    →  Gemini 2.5 Flash (structured output + vision)
```

All auth is stateless JWT: the frontend obtains a Firebase ID token after Google Sign-In, sends it as `Authorization: Bearer <token>` on every request, and the backend verifies it via the Firebase Admin SDK.

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| Backend framework | FastAPI | 0.136.1 |
| ASGI server | Uvicorn | 0.47.0 |
| Data validation | Pydantic v2 | 2.13.4 |
| Settings | pydantic-settings | 2.14.1 |
| ODM | Beanie | 2.0.0 |
| Async Mongo driver | Motor | 3.7.1 |
| Firebase Admin | firebase-admin | 7.4.0 |
| AI SDK | google-genai | 2.4.0 |
| HTTP client | httpx | 0.28.1 |
| TLS certs | certifi | 2026.4.22 |
| Env loader | python-dotenv | 1.2.2 |
| Frontend framework | Next.js | 16.2.6 |
| UI | React | 19.2.6 |
| Styling | Tailwind CSS | v4.3.0 |
| Animations | Framer Motion | 12.38.0 |
| Icons | Lucide React | 1.16.0 |
| Firebase client | firebase | 12.13.0 |
| HTTP | Axios | 1.16.1 |

---

## Prerequisites

| Tool | Min version | Install |
|---|---|---|
| Python | 3.12 | `brew install python@3.12` |
| Node.js | 20 | `brew install node@20` |
| npm | 10 | bundled with Node |
| make | any | pre-installed on macOS/Linux |

> MongoDB is **not** run locally — it lives in MongoDB Atlas (cloud).

---

## External Services Setup

You need accounts on three services before running anything.

### 1. MongoDB Atlas

1. Create a free cluster at <https://cloud.mongodb.com>.
2. Create a database user (username + password).
3. Whitelist your IP (or `0.0.0.0/0` for dev).
4. Copy the **connection string**: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
5. The app creates the database `campus_canteen` and three collections automatically on first startup:
   - `user_profiles`
   - `calendar_events`
   - `academic_notes`

> The database name is `campus_canteen` (a legacy name from the project's origin); it is hard-coded in `backend/app/core/database.py`.

### 2. Firebase

#### 2a. Create project & web app
1. Go to <https://console.firebase.google.com> → **Add project**.
2. Inside the project → **Project settings** → **Your apps** → **Add app** → Web.
3. Register the app and copy these four values into frontend `.env.local`:
   - `apiKey`, `authDomain`, `projectId`, `appId`

#### 2b. Enable Google Sign-In
1. **Authentication** → **Sign-in method** → **Google** → **Enable** → Save.
2. **Authentication** → **Settings** → **Authorized domains** → confirm `localhost` is listed (it is by default).

#### 2c. Service Account (backend)
1. **Project settings** → **Service accounts** → **Generate new private key**.
2. Download the JSON file.
3. Minify it to a single line and paste the whole thing as the value of `FIREBASE_SERVICE_ACCOUNT_KEY` in `backend/.env`.
   Quick minify: `python3 -c "import json; print(json.dumps(json.load(open('serviceAccount.json'))))"`

### 3. Google AI (Gemini)

1. Go to <https://aistudio.google.com/app/apikey>.
2. Click **Create API key** → copy it.
3. Paste it as `GEMINI_API_KEY` in `backend/.env`.

---

## Environment Variables

### Backend — `backend/.env`

Create this file (copy from `backend/.env.example`, then replace the legacy `DATABASE_URL` line with `MONGODB_URL` — the code reads `MONGODB_URL`):

```env
# ── MongoDB Atlas ──────────────────────────────────────────────────────────────
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# ── Firebase Admin SDK ────────────────────────────────────────────────────────
FIREBASE_PROJECT_ID=your-firebase-project-id
# Paste the full service-account JSON as a single-line string:
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","token_uri":"https://oauth2.googleapis.com/token", ...}

# ── Google Gemini AI ──────────────────────────────────────────────────────────
GEMINI_API_KEY=AIza...

# ── App ───────────────────────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000
DEBUG=true
```

> **Never commit this file.** It is already in `.gitignore`.

### Frontend — `frontend/.env.local`

Create this file (copy from `frontend/.env.local.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx
```

> All `NEXT_PUBLIC_` variables are embedded into the client bundle at build time.

---

## Local Development

### First-time setup

```bash
# 1. Enter the repo
cd Calender-and-Note

# 2. Install ALL dependencies (backend venv + frontend node_modules)
make install

# 3. Create env files
cp backend/.env.example   backend/.env        # fill in your values (use MONGODB_URL)
cp frontend/.env.local.example frontend/.env.local  # fill in your values
```

### Run both services

```bash
# From the repo root — backend on :8000, frontend on :3000
make dev
```

Or individually:

```bash
cd backend && make dev    # auto-reload
cd frontend && make dev   # next dev
```

### Useful Make targets

| Command | What it does |
|---|---|
| `make install` | Create `.venv`, install Python deps + `npm install` |
| `make dev` | Start backend (:8000) + frontend (:3000) concurrently |
| `cd backend && make dev` | Backend only with hot-reload |
| `cd backend && make run` | Backend production mode (2 workers) |
| `cd backend && make lint` / `make format` | ruff linter / formatter |
| `cd frontend && make build` | Production static export → `frontend/out/` |
| `cd frontend && make lint` | ESLint |

### Verify it's working

```bash
curl http://localhost:8000/health
# → {"status":"healthy","version":"1.0.0"}

open http://localhost:8000/docs   # interactive API docs
open http://localhost:3000        # frontend
```

---

## Project Structure

```
Calender-and-Note/
├── Makefile                   # root orchestrator (install / dev)
├── docker-compose.yml         # Docker stack
├── firebase.json              # Firebase Hosting config + Cloud Run rewrite
├── .firebaserc                # Firebase project alias (canteen-56f17)
├── README.md
├── plans/
│   ├── PROJECT.md             # this file
│   ├── SUBMISSION.md          # hackathon submission write-up
│   ├── new_plan.md            # the pivot to the academic helper (design record)
│   ├── plan.md                # original canteen master prompt (superseded)
│   └── chatbot.md             # original canteen AI-concierge spec (superseded)
│
├── backend/
│   ├── .env                   # ← YOU CREATE THIS (see env section)
│   ├── requirements.txt       # pinned Python dependencies
│   ├── seed.py                # LEGACY canteen seed script (broken / unused)
│   ├── deploy-backend.sh      # Cloud Run deployment script
│   ├── Makefile
│   ├── Dockerfile             # multi-stage Python 3.12 build
│   └── app/
│       ├── main.py            # FastAPI app, CORS, lifespan, /health
│       ├── api/v1/
│       │   ├── auth.py        # Firebase token verification, get_current_user, new-user seeding
│       │   ├── calendar.py    # Event CRUD + POST /chat/parse (AI scheduling)
│       │   └── notes.py       # Note CRUD + Gemini Vision processing
│       ├── core/
│       │   ├── config.py      # Pydantic settings (reads .env via lru_cache)
│       │   └── database.py    # Motor client, Beanie init (uses certifi TLS)
│       ├── models/
│       │   └── models.py      # Beanie Documents: UserProfile, CalendarEvent, AcademicNote
│       ├── schemas/
│       │   └── schemas.py     # Pydantic I/O + Gemini structured-output schemas
│       └── services/
│           └── gemini_service.py  # parse_schedule_intent + process_canvas_note
│
└── frontend/
    ├── .env.local             # ← YOU CREATE THIS (see env section)
    ├── .env.production        # NEXT_PUBLIC_API_URL empty (for static export)
    ├── package.json
    ├── next.config.js         # output: "export", static to frontend/out/
    ├── tailwind.config.js
    ├── Makefile
    ├── Dockerfile
    └── src/
        ├── app/
        │   ├── layout.tsx     # Root layout, Lexend font, AuthProvider, Navbar
        │   ├── page.tsx       # Landing / home page
        │   ├── calendar/page.tsx   # Monthly grid + AI scheduling chat
        │   ├── notes/page.tsx      # HTML5 canvas + note library with AI results
        │   ├── dashboard/page.tsx  # Profile, upcoming events, recent notes
        │   ├── menu/page.tsx       # legacy redirect → /calendar
        │   └── cart/page.tsx       # legacy redirect → /notes
        ├── components/
        │   ├── navbar.tsx
        │   └── ui/
        │       ├── Button.tsx
        │       ├── Card.tsx
        │       └── Modal.tsx
        ├── context/
        │   └── auth-context.tsx   # Firebase Auth state, Google sign-in
        └── lib/
            ├── api.ts         # Axios instance, auto-attaches Bearer token
            ├── firebase.ts    # Firebase app init, auth, googleProvider
            └── utils.ts       # cn() helper, misc utilities
```

---

## API Reference

Base URL: `http://localhost:8000`
Auth: `Authorization: Bearer <firebase-id-token>` on all routes except `/health`.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Liveness check → `{ status, version }` |

### Calendar — `/api/v1/calendar`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/calendar/` | User | List events (filter: `?month=5&year=2026`) |
| POST | `/api/v1/calendar/` | User | Create an event |
| GET | `/api/v1/calendar/{id}` | User | Get a single event |
| PATCH | `/api/v1/calendar/{id}` | User | Update an event |
| DELETE | `/api/v1/calendar/{id}` | User | Delete an event |
| POST | `/api/v1/calendar/chat/parse` | User | Parse a NL message → draft event + confirmation text |

**Event categories**: `Exam` · `Assignment` · `Study Session` · `Class` · `Other`

**`POST /api/v1/calendar/chat/parse`**

```json
// Request
{ "message": "Add a Physics exam next Monday at 10 AM" }

// Response
{
  "event": {
    "title": "Physics Exam",
    "description": "...",
    "start_time": "2026-06-29T10:00:00+00:00",
    "end_time": "2026-06-29T11:00:00+00:00",
    "category": "Exam"
  },
  "confirmation_message": "I've prepared an \"Exam\" event: \"Physics Exam\" ..."
}
```

### Notes — `/api/v1/notes`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/notes/` | User | List the user's notes (newest first) |
| POST | `/api/v1/notes/` | User | Create a note — runs Gemini Vision on the canvas image |
| GET | `/api/v1/notes/{id}` | User | Get a single note |
| DELETE | `/api/v1/notes/{id}` | User | Delete a note |

**`POST /api/v1/notes/`**

```json
// Request — raw_canvas_data is a base64 PNG data URL exported from the HTML5 canvas
{ "title": "Sorting Algorithms", "raw_canvas_data": "data:image/png;base64,iVBOR..." }

// Response — Gemini-enriched
{
  "id": "...",
  "user_id": "...",
  "title": "Sorting Algorithms",
  "extracted_text": "Merge Sort: O(n log n) ...",
  "ai_summary": "Four fundamental comparison-based sorting algorithms ...",
  "action_items": ["Implement merge sort from scratch", "..."],
  "created_at": "..."
}
```

### Making a user Admin

Manually set the flag in MongoDB Atlas:
```javascript
// In Atlas Data Explorer or mongosh
db.user_profiles.updateOne(
  { _id: "<firebase-uid>" },
  { $set: { is_admin: true } }
)
```

---

## Docker

Build and run the full stack with Docker Compose. Create a `.env` in the repo root with the variables that `docker-compose.yml` expects:

```env
# backend
GEMINI_API_KEY=AIza...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# frontend
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
```

Then:

```bash
docker compose up --build
# Backend → http://localhost:8000
# Frontend → http://localhost:3000
```

> `docker-compose.yml` currently passes a `DATABASE_URL` to the backend, but the backend reads `MONGODB_URL`. Update the compose file's backend env to `MONGODB_URL` for containerised MongoDB connectivity.

---

## Deployment Notes

### Production URLs

| Service | URL |
|---|---|
| Frontend (Firebase Hosting) | `https://canteen-56f17.web.app` |
| Backend (Cloud Run) | `https://canteen-backend-885567530091.asia-south1.run.app` |
| GCP / Firebase project | `canteen-56f17` |
| Cloud Run service | `canteen-backend` (region: `asia-south1`) |

> These identifiers retain the original "canteen" naming from before the pivot and are kept intentionally — they are live resources.

### Backend → Google Cloud Run

```bash
cd backend
bash deploy-backend.sh
```

The script converts `backend/.env` → `/tmp/canteen_env.yaml` (safely handling JSON in `FIREBASE_SERVICE_ACCOUNT_KEY`), then runs `gcloud run deploy` with `--env-vars-file`. Cloud Build builds the Docker image and pushes to Artifact Registry.

**Important constraints:**
- Region is always `asia-south1`
- Service allows unauthenticated access (`--allow-unauthenticated`)
- MongoDB Atlas must have `0.0.0.0/0` whitelisted (Cloud Run uses dynamic egress IPs)
- Container port: `8080` (Cloud Run standard); min 0 / max 5 instances

### Frontend → Firebase Hosting

```bash
# Always build with empty API URL so Axios uses relative paths (rewritten by Firebase)
cd frontend && NEXT_PUBLIC_API_URL= npm run build && cd ..
firebase deploy --only hosting --project canteen-56f17
```

Build output lands in `frontend/out/` — the Firebase Hosting `public` directory. Firebase rewrites `/api/v1/**` to Cloud Run and `**` to `/index.html`.

> **Critical:** `.env.local` always overrides `.env.production` in Next.js. Always pass `NEXT_PUBLIC_API_URL=` explicitly when building for production.

### Other Notes

- **MongoDB TLS**: the Motor client is configured with `tlsCAFile=certifi.where()` — no extra flags needed for `mongodb+srv://`.
- **Firebase service account key**: pass as a single-line JSON string via `FIREBASE_SERVICE_ACCOUNT_KEY` — no file mounting required.
- **Admin users**: there is no admin sign-up flow. Set `is_admin: true` directly in MongoDB Atlas after the user first logs in (which auto-creates their profile and seeds demo data).
