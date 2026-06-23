# StudyMind — GitHub Copilot Instructions

> These instructions apply to every file in this repository.
> Copilot must follow them when generating, editing, or reviewing code.

---

## 1. Project Overview

**StudyMind** is a full-stack AI academic helper. It has two Gemini-powered features:

1. **Smart Academic Calendar** — natural-language scheduling ("add a physics exam Friday at 2 PM") parsed by Gemini into structured calendar events, plus full manual CRUD.
2. **Canvas Note Board** — handwritten/drawn HTML5 canvas images processed by Gemini Vision into OCR text, an AI summary, and action items.

| Layer | Technology | Hosted on |
|---|---|---|
| Frontend | Next.js 16 (static export), React 19, TypeScript, Tailwind CSS v4 | Firebase Hosting |
| Backend | FastAPI, Python 3.12, Pydantic v2, Beanie ODM | Google Cloud Run (`asia-south1`) |
| Database | MongoDB Atlas (`campus_canteen` DB) | MongoDB Atlas (cloud) |
| Auth | Firebase Authentication (Google OAuth) | Firebase |
| AI | Google Gemini 2.5 Flash (`google-genai`) | Google AI |

> **Legacy naming:** the project pivoted from an earlier "Campus Canteen" app. Infrastructure identifiers retain the old name and must **not** be renamed — they are live resources:
> - GCP / Firebase project ID: **`canteen-56f17`**
> - Cloud Run service: **`canteen-backend`**, region **`asia-south1`**
> - MongoDB database name: **`campus_canteen`**
> - Frontend URL: **`https://canteen-56f17.web.app`**

---

## 2. Repository Structure

```
Calender-and-Note/
├── .github/
│   └── copilot-instructions.md   ← you are here
├── backend/                      ← FastAPI service
│   ├── .venv/                    ← Python virtual environment (never commit)
│   ├── app/
│   │   ├── api/v1/               ← Route handlers: auth, calendar, notes
│   │   ├── core/                 ← config.py (pydantic-settings), database.py (Motor + Beanie)
│   │   ├── models/models.py      ← Beanie Documents (UserProfile, CalendarEvent, AcademicNote)
│   │   ├── schemas/schemas.py    ← Pydantic request/response + Gemini structured-output schemas
│   │   ├── services/             ← gemini_service.py (calendar parsing + note vision)
│   │   └── main.py               ← FastAPI app, CORS, lifespan, /health
│   ├── .env                      ← Local secrets (never commit)
│   ├── deploy-backend.sh         ← Cloud Run deployment script
│   ├── Dockerfile                ← Multi-stage build (builder + runtime)
│   ├── Makefile                  ← Dev workflow commands
│   ├── requirements.txt          ← Pinned Python dependencies
│   └── seed.py                   ← LEGACY canteen seed script (broken, unused — see §6)
├── frontend/                     ← Next.js app
│   ├── src/
│   │   ├── app/                  ← App Router pages (/, /calendar, /notes, /dashboard)
│   │   ├── components/           ← navbar.tsx + ui/ (Button, Card, Modal)
│   │   ├── context/              ← auth-context.tsx (Firebase user state)
│   │   └── lib/                  ← api.ts (Axios), firebase.ts, utils.ts
│   ├── .env.local                ← Local secrets (never commit, overrides .env.production)
│   ├── .env.production           ← Production env (NEXT_PUBLIC_API_URL empty)
│   ├── next.config.js            ← output: "export", images.unoptimized: true
│   ├── Makefile                  ← Dev workflow commands
│   └── Dockerfile                ← Multi-stage Node build
├── .firebaserc                   ← Firebase project alias
├── firebase.json                 ← Hosting config + Cloud Run rewrite
├── docker-compose.yml            ← Local container orchestration
└── Makefile                      ← Root orchestrator (delegates to backend/ + frontend/)
```

---

## 3. Development Workflow

### 3.1 First-time Setup

```bash
make install   # backend venv + frontend npm deps in one command
```

Delegates to `backend/Makefile install` (creates `.venv`, installs `requirements.txt`) and `frontend/Makefile install` (`npm install`).

### 3.2 Running Locally

```bash
make dev
# Backend:  http://localhost:8000  (uvicorn --reload)
# Frontend: http://localhost:3000  (next dev)
```

Individual services:
```bash
make -C backend dev     # uvicorn --reload, kills port 8000 first
make -C frontend dev    # npm run dev
```

### 3.3 Make Targets

| Scope | Target | Action |
|---|---|---|
| root | `make install` / `make dev` | Install all deps / run both services |
| backend | `make install` | Create `.venv`, install `requirements.txt` |
| backend | `make dev` / `make run` | Reload mode / production (2 workers) |
| backend | `make lint` / `make format` | `ruff check app/` / `ruff format app/` |
| backend | `make freeze` | Pin current deps → `requirements.txt` |
| frontend | `make dev` / `make build` / `make start` | Next.js dev / static export / serve |
| frontend | `make lint` | ESLint |

---

## 4. Python Virtual Environment

The backend uses a **local `.venv`** managed by the Makefile. Never use system Python or a global environment.

```bash
make -C backend install            # create / recreate venv + deps
source backend/.venv/bin/activate  # activate for interactive use
backend/.venv/bin/python script.py # run without activating
make -C backend freeze             # pin deps after adding a package
```

- Makefile variables `VENV_PYTHON`/`VENV_PIP` resolve to `.venv/bin/python` and `.venv/bin/pip`; `UVICORN` resolves to `.venv/bin/uvicorn app.main:app`.
- Never suggest a system-level `pip install` or running `python3` directly.

---

## 5. Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URL` | Full `mongodb+srv://` connection string for Atlas |
| `FIREBASE_PROJECT_ID` | GCP / Firebase project ID (`canteen-56f17`) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK JSON **as a single-line string** |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FRONTEND_URL` | `https://canteen-56f17.web.app` in production |
| `ALLOWED_ORIGINS` | JSON-array string of allowed CORS origins |

Loaded via `pydantic-settings` (`BaseSettings`, `env_file=".env"`).

> **Heads-up:** the committed `backend/.env.example` still lists a legacy `DATABASE_URL`. The code reads `MONGODB_URL` (`app/core/config.py`). When editing examples, prefer `MONGODB_URL`.

### Frontend (`frontend/.env.*`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | **Empty string** in production — Axios uses relative paths. `http://localhost:8000` in `.env.local` for dev |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `canteen-56f17.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `canteen-56f17` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

> **Critical:** `.env.local` **always overrides** `.env.production` in Next.js, even during `npm run build`. When building for production, always pass `NEXT_PUBLIC_API_URL=` explicitly:
> ```bash
> NEXT_PUBLIC_API_URL= npm run build
> ```

---

## 6. Data Layer

### MongoDB Models (Beanie Documents — `backend/app/models/models.py`)

- `UserProfile` — Firebase UID as `_id` (`id: str`), email, display_name, photo_url, `is_admin`, timestamps. Collection: `user_profiles`.
- `CalendarEvent` — user_id, title, description, start_time, end_time, `category` (`EventCategory` enum), timestamps. Collection: `calendar_events`.
- `AcademicNote` — user_id, title, `raw_canvas_data` (base64 PNG data URL), `extracted_text`, `ai_summary`, `action_items: List[str]`, timestamps. Collection: `academic_notes`.

`EventCategory` enum values (exact strings): `Exam`, `Assignment`, `Study Session`, `Class`, `Other`.

All document IDs are **MongoDB ObjectId strings** (except `UserProfile.id`, which is the Firebase UID). Never use `int` for IDs.

> **`seed.py` is dead code.** It imports `MenuItem`, `MealCategory`, `Ingredient`, `Order` — models that no longer exist after the pivot — so it will not run. Do not reference it. New accounts are seeded automatically by `_seed_new_user()` in `app/api/v1/auth.py`, which inserts demo `CalendarEvent`s and a sample `AcademicNote` on first sign-in.

### Schemas (`backend/app/schemas/schemas.py`)

- `Base` / `Create` / `Update` / `Read` schema classes per model; all `Read` schemas use `id: str`.
- Gemini structured-output schemas: `StructuredCalendarEvent` (calendar parsing) and `NoteAnalysisResponse` (note vision).

### Frontend Types (`frontend/src/lib/api.ts`)

- All `id` fields are `string`. Types: `EventCategory`, `CalendarEvent`, `CalendarEventCreate`, `CalendarChatResponse`, `AcademicNote`.
- API groups: `calendarApi` (list/create/update/delete/parseChat) and `notesApi` (list/create/get/delete). Never use `number` for entity IDs.

---

## 7. API Design

- Base prefix: `/api/v1`
- Mounted routers (`app/main.py`): **`calendar`**, **`notes`**.
- `auth.py` is a dependency module (not a mounted router): it verifies Firebase ID tokens via `Authorization: Bearer <token>` and exposes `get_current_user` / `require_admin`.
- Health check: `GET /health` → `{ status, version }`.
- Interactive docs: `/docs` (Swagger), `/redoc`.

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/v1/calendar/` | List (optional `?month=&year=`) / create |
| GET/PATCH/DELETE | `/api/v1/calendar/{id}` | Read / update / delete one |
| POST | `/api/v1/calendar/chat/parse` | NL message → draft `CalendarEvent` |
| GET/POST | `/api/v1/notes/` | List (newest first) / create (runs Gemini Vision) |
| GET/DELETE | `/api/v1/notes/{id}` | Read / delete one |

Every handler scopes documents to `current_user.id`; cross-user access returns 404.

### CORS

Allowed origins come from `settings.ALLOWED_ORIGINS` (`list[str]` from `.env`). Locally: `http://localhost:3000`. Production: `https://canteen-56f17.web.app`.

---

## 8. AI Layer (`backend/app/services/gemini_service.py`)

Two functions, both using `gemini-2.5-flash` with `response_mime_type="application/json"` and a Pydantic `response_schema`:

- **`parse_schedule_intent(message)`** — passes the current timestamp as context, returns `StructuredCalendarEvent` (title, description, start_time/end_time as ISO 8601, category). The handler then builds a human-readable `confirmation_message` in Python and returns a `CalendarChatResponse`. Temperature `0.1`.
- **`process_canvas_note(raw_canvas_data)`** — decodes the base64 PNG data URL to bytes, sends it as a `types.Part` image, returns `NoteAnalysisResponse` (`extracted_text`, `ai_summary`, `action_items`). Temperature `0.2`.

System instructions (`CALENDAR_SYSTEM_INSTRUCTION`, `NOTE_SYSTEM_INSTRUCTION`) live at the top of the file. The Gemini client reads `GEMINI_API_KEY` from settings.

---

## 9. Frontend Architecture

### API Client (`frontend/src/lib/api.ts`)

```ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  timeout: 60_000, // long, for Gemini vision calls
});
```

A request interceptor attaches the Firebase ID token (`auth.currentUser.getIdToken()`) as a Bearer header on every request. In production, `NEXT_PUBLIC_API_URL` is empty so `baseURL` is `""` and requests use the page origin; Firebase Hosting rewrites `/api/v1/**` to Cloud Run.

### Pages

`/` (landing), `/calendar` (monthly grid + AI scheduling chat), `/notes` (HTML5 canvas + note library with AI results), `/dashboard` (profile, upcoming events, recent notes). `/menu` and `/cart` are **legacy redirect stubs** (→ `/calendar` and `/notes`) left over from the canteen origin — keep them as redirects or delete; do not build features on them.

### Routing (`firebase.json`)

```json
"rewrites": [
  { "source": "/api/v1/**", "run": { "serviceId": "canteen-backend", "region": "asia-south1" } },
  { "source": "**", "destination": "/index.html" }
]
```

Any change to `firebase.json` rewrites requires `firebase deploy --only hosting`.

### Static Export

`next.config.js` uses `output: "export"`. The build emits static files to `frontend/out/`, the Firebase Hosting `public` directory. There is no Node server; all pages are pre-rendered.

---

## 10. Deployment

### Backend → Google Cloud Run

```bash
cd backend && bash deploy-backend.sh
```

The script: enables required GCP APIs; converts `backend/.env` → `/tmp/canteen_env.yaml` (handles JSON in `FIREBASE_SERVICE_ACCOUNT_KEY`); runs `gcloud run deploy canteen-backend --source .` with `--env-vars-file`.

**Constraints:** region `asia-south1`; `--allow-unauthenticated`; MongoDB Atlas must whitelist `0.0.0.0/0` (Cloud Run uses dynamic egress IPs); container port `8080`; min 0 / max 5 instances.

### Frontend → Firebase Hosting

```bash
cd frontend && NEXT_PUBLIC_API_URL= npm run build && cd ..
firebase deploy --only hosting --project canteen-56f17
```

The static `frontend/out/` is uploaded; rewrites proxy `/api/v1/**` to Cloud Run and `**` to `/index.html`.

### Docker Compose (Local Containers)

```bash
docker-compose up --build   # backend :8000, frontend :3000
```

---

## 11. Code Style & Conventions

### Python (Backend)

- **Python 3.12** — modern syntax (`list[str]`, `str | None`, `match`).
- **Pydantic v2** — use `model_validator` / `field_validator`; avoid v1 `@validator`.
- **Beanie** — `Document` for top-level collections; `BaseModel` for embedded sub-documents and Gemini schemas.
- **Async-first** — all route handlers and DB calls are `async def`.
- **Linting/formatting:** `ruff check app/` / `ruff format app/` before committing.
- **Imports:** absolute from `app.*`.
- Never call `Settings()` directly — use `get_settings()` (cached via `lru_cache`); the module exposes `settings`.

### TypeScript (Frontend)

- **Strict TypeScript** — avoid `any` without justification.
- **All IDs are `string`** — never `number`.
- **React context** — `auth-context.tsx` for Firebase user state (Google sign-in, `onAuthStateChanged`). There is no cart context.
- **Tailwind CSS v4** — utility classes; theme tokens are `academic-*` / `ink-*` colours.
- **Typography** — the sole typeface is **Lexend** (Google Fonts) via `next/font/google`, weights 300–700, CSS variable `--font-lexend`. Both `font-display` and `font-body` resolve to Lexend. Never introduce other typefaces.
- **Axios** — all API calls go through the `api` instance in `lib/api.ts`; never call `fetch` directly.

### General

- Never hard-code secrets, API keys, or connection strings in source code.
- Never commit `.env`, `.env.local`, `.venv/`, `node_modules/`, or `frontend/out/`.
- Use `make` targets for routine operations.

---

## 12. Dependency Management

```bash
# Python
source backend/.venv/bin/activate
pip install <package>
make -C backend freeze        # updates requirements.txt

# Node
cd frontend && npm install <package>
```

---

## 13. Common Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Backend startup fails with `SSL handshake failed` | MongoDB Atlas IP not whitelisted | Add `0.0.0.0/0` in Atlas → Network Access |
| AI scheduling returns 502 | Missing/invalid `GEMINI_API_KEY` | Set a valid key in `backend/.env` |
| Note save returns 502 | Gemini Vision call failed (bad image / key / quota) | Check the canvas PNG data URL and key |
| Frontend calls localhost in production | Build picked up a non-empty API URL | Rebuild with `NEXT_PUBLIC_API_URL= npm run build` |
| `gcloud run deploy` fails on env var special chars | JSON in `FIREBASE_SERVICE_ACCOUNT_KEY` | Use `--env-vars-file` (handled by `deploy-backend.sh`) |
| Port 8000 already in use | Previous uvicorn not killed | `make -C backend dev` runs the `kill` target first |
| `seed.py` import error | It references removed canteen models | Don't run it — seeding is automatic in `auth.py` |
