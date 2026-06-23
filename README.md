# StudyMind — AI Academic Helper

A production-grade, full-stack academic assistant that turns natural language into calendar events and handwritten canvas sketches into transcribed, summarised notes — powered by Google Gemini 2.5 Flash.

> **Two AI features, one stack:**
> - **Smart Academic Calendar** — describe an event in plain English ("schedule my physics exam Friday at 2 PM") and Gemini parses it into a structured, confirmable calendar event.
> - **Canvas Note Board** — draw or handwrite on an in-browser HTML5 canvas; Gemini Vision OCRs the image, writes a summary, and extracts action items.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, static export), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React |
| Frontend hosting | Firebase Hosting (static `out/` + rewrite proxy to the backend) |
| Backend | FastAPI (Python 3.12), Uvicorn, Pydantic v2 |
| Backend hosting | Google Cloud Run (Docker, `asia-south1`) |
| Database | MongoDB Atlas + Beanie ODM (async, on Motor) |
| Auth | Firebase Auth (Google Sign-In), verified server-side via Firebase Admin SDK |
| AI | Google Gemini 2.5 Flash — structured JSON output + multimodal vision (`google-genai`) |

## Features

- **AI calendar scheduling** — natural-language chat → structured `CalendarEvent` draft you confirm with one click (`POST /api/v1/calendar/chat/parse`).
- **Full calendar CRUD** — monthly view with category colour-coding: `Exam`, `Assignment`, `Study Session`, `Class`, `Other`.
- **Canvas note intelligence** — handwritten/drawn PNG → Gemini Vision returns `extracted_text` (OCR), `ai_summary`, and `action_items`, all persisted to MongoDB.
- **Dashboard / profile** — upcoming events and recent notes at a glance.
- **Automatic onboarding** — brand-new accounts are seeded with demo events and a sample note on first sign-in (see `_seed_new_user` in `backend/app/api/v1/auth.py`).
- **Stateless auth** — every request carries a Firebase ID token (`Authorization: Bearer <token>`); the backend verifies it with the Firebase Admin SDK. No sessions.

## Project Structure

```
Calender-and-Note/
├── backend/                  # FastAPI service
│   └── app/
│       ├── main.py           # App, CORS, lifespan (Beanie/Mongo init), /health
│       ├── api/v1/
│       │   ├── auth.py       # Firebase token verification, get_current_user, new-user seeding
│       │   ├── calendar.py   # Event CRUD + /chat/parse (AI scheduling)
│       │   └── notes.py      # Note CRUD + Gemini Vision processing
│       ├── core/             # config.py (pydantic-settings), database.py (Motor + Beanie)
│       ├── models/models.py  # Beanie Documents: UserProfile, CalendarEvent, AcademicNote
│       ├── schemas/          # Pydantic request/response + Gemini structured-output schemas
│       └── services/         # gemini_service.py (parse_schedule_intent, process_canvas_note)
├── frontend/                 # Next.js application
│   └── src/
│       ├── app/              # Routes: / (landing), /calendar, /notes, /dashboard
│       ├── components/       # navbar.tsx, ui/ (Button, Card, Modal)
│       ├── context/          # auth-context.tsx (Firebase auth state)
│       └── lib/              # api.ts (Axios + token), firebase.ts, utils.ts
├── docker-compose.yml        # Local full-stack orchestration
├── firebase.json             # Hosting config + Cloud Run rewrite
└── Makefile                  # Root orchestrator (install / dev)
```

## Quick Start (Local Development)

### Prerequisites
- Python 3.12+
- Node.js 20+
- A MongoDB Atlas cluster, a Firebase project, and a Gemini API key (see [External Services](#external-services))

### 1. Install dependencies

```bash
# From the repo root — sets up backend/.venv and frontend/node_modules
make install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Set: MONGODB_URL, FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_KEY, GEMINI_API_KEY

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Set the NEXT_PUBLIC_FIREBASE_* values
```

> **Note:** the backend reads `MONGODB_URL` (MongoDB Atlas connection string). The committed `backend/.env.example` still shows a legacy `DATABASE_URL` placeholder from the project's origins — use `MONGODB_URL` instead.

### 3. Run

```bash
# Both services concurrently (Ctrl-C stops both)
make dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs (Swagger): http://localhost:8000/docs

Run services individually:

```bash
cd backend  && make dev    # uvicorn --reload on :8000
cd frontend && make dev    # next dev on :3000
```

Or with Docker:

```bash
docker-compose up --build
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URL` | MongoDB Atlas connection string (`mongodb+srv://…`) |
| `FIREBASE_PROJECT_ID` | Firebase / GCP project ID |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK JSON, as a single-line string (or a path) |
| `GEMINI_API_KEY` | Google AI Studio Gemini API key |
| `FRONTEND_URL` | Allowed frontend origin (default `http://localhost:3000`) |
| `ALLOWED_ORIGINS` | JSON-array string of CORS origins |
| `DEBUG` | `true` in development |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL. `http://localhost:8000` in dev; **empty** for production builds so Axios uses relative paths (rewritten by Firebase Hosting) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app ID |

## External Services

### MongoDB Atlas
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Add a database user and whitelist your IP (or `0.0.0.0/0` for dev / Cloud Run).
3. Copy the connection string into `MONGODB_URL`.
4. The app creates the `campus_canteen` database and these collections on first startup: `user_profiles`, `calendar_events`, `academic_notes`.

### Firebase (Auth + Hosting)
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Sign-in method → Google → Enable.**
3. Add a Web app and copy the config values into the frontend `.env.local`.
4. **Project settings → Service accounts → Generate new private key**; paste the minified JSON into `FIREBASE_SERVICE_ACCOUNT_KEY`.

### Gemini API Key
1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Create a key and set it as `GEMINI_API_KEY`.

## API Reference

Base URL: `http://localhost:8000` · Auth: `Authorization: Bearer <firebase-id-token>` on all routes except `/health`.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check → `{ status, version }` |
| GET | `/api/v1/calendar/` | List events (optional `?month=&year=` filter) |
| POST | `/api/v1/calendar/` | Create an event |
| GET | `/api/v1/calendar/{id}` | Get one event |
| PATCH | `/api/v1/calendar/{id}` | Update an event |
| DELETE | `/api/v1/calendar/{id}` | Delete an event |
| POST | `/api/v1/calendar/chat/parse` | Parse a natural-language message into a draft event |
| GET | `/api/v1/notes/` | List notes (newest first) |
| POST | `/api/v1/notes/` | Create a note — runs Gemini Vision on the canvas image |
| GET | `/api/v1/notes/{id}` | Get one note |
| DELETE | `/api/v1/notes/{id}` | Delete a note |

Interactive docs are served at `/docs` (Swagger) and `/redoc`.

## Make Targets

| Command | Action |
|---|---|
| `make install` | Install backend (venv) + frontend (npm) dependencies |
| `make dev` | Run backend (:8000) and frontend (:3000) concurrently |
| `cd backend && make dev` | Backend only, auto-reload |
| `cd backend && make run` | Backend production mode (2 workers) |
| `cd backend && make lint` / `make format` | `ruff` check / format |
| `cd frontend && make build` | Production static export to `frontend/out/` |
| `cd frontend && make lint` | ESLint |

## Admin Access

Set `is_admin: true` on the user's document in the `user_profiles` collection (Atlas Data Explorer or `mongosh`):

```javascript
db.user_profiles.updateOne({ _id: "<firebase-uid>" }, { $set: { is_admin: true } })
```

## Deployment

### Backend → Google Cloud Run

```bash
cd backend && bash deploy-backend.sh
```

The script converts `backend/.env` into a YAML env file (handling JSON in `FIREBASE_SERVICE_ACCOUNT_KEY`) and runs `gcloud run deploy` from source. Region is `asia-south1`; the service allows unauthenticated access and listens on port `8080`.

### Frontend → Firebase Hosting

```bash
# Build with an empty API URL so Axios uses relative paths (proxied by the rewrite)
cd frontend && NEXT_PUBLIC_API_URL= npm run build && cd ..
firebase deploy --only hosting
```

`firebase.json` rewrites `/api/v1/**` to the Cloud Run service and serves everything else from the static `frontend/out/` export.

> **Critical:** `.env.local` overrides `.env.production` in Next.js even during `npm run build`. Always pass `NEXT_PUBLIC_API_URL=` explicitly for production builds.

## Notes on Legacy Naming

This project pivoted from an earlier "Campus Canteen" food-ordering app. Some infrastructure identifiers still carry the old name and are intentionally preserved (they are live resources):

- Firebase / GCP project: `canteen-56f17`
- Cloud Run service: `canteen-backend`
- MongoDB database name: `campus_canteen`

A few source artifacts are also leftovers from that origin: `frontend/src/app/menu` and `cart` are now redirect stubs (→ `/calendar` and `/notes`), and `backend/seed.py` references old canteen models and is no longer used — new-user data is seeded automatically by `_seed_new_user` in `backend/app/api/v1/auth.py`.

## Repository

[github.com/darklight9911/Calender-and-Note](https://github.com/darklight9911/Calender-and-Note)
