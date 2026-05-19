# CampusEats — GitHub Copilot Instructions

> These instructions apply to every file in this repository.
> Copilot must follow them when generating, editing, or reviewing code.

---

## 1. Project Overview

**CampusEats** is a full-stack smart campus canteen management system.

| Layer | Technology | Hosted on |
|---|---|---|
| Frontend | Next.js 15 (static export), React 19, TypeScript, Tailwind CSS | Firebase Hosting |
| Backend | FastAPI, Python 3.12, Pydantic v2, Beanie ODM | Google Cloud Run (`asia-south1`) |
| Database | MongoDB Atlas (`campus_canteen` DB, `mongodb+srv://...@cluster0.zntivcj.mongodb.net`) | MongoDB Atlas (cloud) |
| Auth | Firebase Authentication (Google OAuth) | Firebase |
| AI | Google Gemini (`google-genai`) via `GeminiService` | Google AI |

GCP / Firebase project ID: **`canteen-56f17`**
Cloud Run service name: **`canteen-backend`**, region **`asia-south1`**
Frontend URL: **`https://canteen-56f17.web.app`**
Backend URL: **`https://canteen-backend-885567530091.asia-south1.run.app`**

---

## 2. Repository Structure

```
Canteen_app/
├── .github/
│   └── copilot-instructions.md   ← you are here
├── backend/                      ← FastAPI service
│   ├── .venv/                    ← Python virtual environment (never commit)
│   ├── app/
│   │   ├── api/v1/               ← Route handlers (auth, menu, orders, chatbot)
│   │   ├── core/                 ← config.py (pydantic-settings), database.py
│   │   ├── models/models.py      ← Beanie Document classes (MongoDB ODM)
│   │   ├── schemas/schemas.py    ← Pydantic request/response schemas
│   │   ├── services/             ← Business logic (gemini_service.py)
│   │   └── main.py               ← FastAPI app, CORS, lifespan
│   ├── .env                      ← Local secrets (never commit)
│   ├── deploy-backend.sh         ← Cloud Run deployment script
│   ├── Dockerfile                ← Multi-stage build (builder + runtime)
│   ├── Makefile                  ← Dev workflow commands
│   ├── requirements.txt          ← Pinned Python dependencies
│   └── seed.py                   ← One-shot MongoDB seed script
├── frontend/                     ← Next.js app
│   ├── src/
│   │   ├── app/                  ← Next.js App Router pages
│   │   ├── components/           ← React components (ui/, feature components)
│   │   ├── context/              ← React context (auth-context, cart-context)
│   │   └── lib/                  ← api.ts (Axios), firebase.ts, utils.ts
│   ├── .env.local                ← Local secrets (never commit, overrides .env.production)
│   ├── .env.production           ← Production build env vars (NEXT_PUBLIC_API_URL=empty)
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
# From repo root — installs venv + npm deps in one command
make install
```

This delegates to:
- `backend/Makefile install` → creates `backend/.venv`, installs `requirements.txt`
- `frontend/Makefile install` → runs `npm install`

### 3.2 Running Locally

```bash
# Start both services concurrently (Ctrl-C stops both)
make dev
# Backend:  http://localhost:8000  (uvicorn --reload)
# Frontend: http://localhost:3000  (Next.js Turbopack)
```

Individual services:
```bash
make -C backend dev     # uvicorn with --reload, kills port 8000 first
make -C frontend dev    # npm run dev
```

### 3.3 Available Make Targets

#### Root `Makefile`
| Target | Action |
|---|---|
| `make install` | Install all dependencies (backend + frontend) |
| `make dev` | Start both services concurrently |

#### `backend/Makefile`
| Target | Action |
|---|---|
| `make install` | Create `.venv`, install `requirements.txt` |
| `make dev` | Kill port 8000, start uvicorn `--reload` |
| `make run` | Production mode, 2 workers |
| `make lint` | `ruff check app/` |
| `make format` | `ruff format app/` |
| `make freeze` | Pin current deps → `requirements.txt` |

#### `frontend/Makefile`
| Target | Action |
|---|---|
| `make install` | `npm install` |
| `make dev` | `npm run dev` (Turbopack) |
| `make build` | `npm run build` (static export) |
| `make start` | `npm run start` |
| `make lint` | `npm run lint` (ESLint) |

---

## 4. Python Virtual Environment

The backend uses a **local `.venv`** managed by the Makefile. Never use the system Python or a globally installed environment.

```bash
# Create / recreate venv + install deps
make -C backend install

# Activate for interactive use
source backend/.venv/bin/activate

# Run anything inside the venv without activating
backend/.venv/bin/python script.py
backend/.venv/bin/pip install <package>

# Pin deps after adding a package
make -C backend freeze
```

- The Makefile variables `VENV_PYTHON` and `VENV_PIP` always resolve to `.venv/bin/python` and `.venv/bin/pip`.
- `UVICORN` resolves to `.venv/bin/uvicorn app.main:app`.
- Never suggest `pip install` at the system level or using `python3` directly.

---

## 5. Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URL` | Full `mongodb+srv://` connection string for Atlas |
| `FIREBASE_PROJECT_ID` | GCP/Firebase project ID (`canteen-56f17`) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK JSON **as a single-line string** |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FRONTEND_URL` | `https://canteen-56f17.web.app` in production |
| `ALLOWED_ORIGINS` | JSON array string of allowed CORS origins |

Loaded via `pydantic-settings` (`BaseSettings`, `env_file=".env"`).

### Frontend (`frontend/.env.*`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | **Empty string** in production — axios uses relative paths. `http://localhost:8000` in `.env.local` for dev |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `canteen-56f17.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `canteen-56f17` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

> **Critical:** `.env.local` **always overrides** `.env.production` in Next.js, even during `npm run build`.
> When building for production deployment, always pass `NEXT_PUBLIC_API_URL=` explicitly:
> ```bash
> NEXT_PUBLIC_API_URL= npm run build
> ```

---

## 6. Data Layer

### MongoDB Models (Beanie Documents — `backend/app/models/models.py`)

- `UserProfile` — Firebase UID as `_id`, email, allergies, calorie limit
- `MenuItem` — name, price, calories, macros, category (`MealCategory` enum), ingredients (`Ingredient` embedded), availability
- `Order` — user ID, items (`OrderItem` embedded), status (`OrderStatus` enum), timestamps

All document IDs are **MongoDB ObjectId strings**. Never use `int` for IDs.

### Schemas (`backend/app/schemas/schemas.py`)

- Separate `Base`, `Create`, and `Read` schema classes per model
- `id: str` in all `Read` schemas — never `id: int`
- `IngredientRead` has no `id` or `menu_item_id` fields — it is an embedded sub-document

### Frontend Types (`frontend/src/lib/api.ts`)

- All `id` fields are `string` (MongoDB ObjectId)
- Cart context, order state, and all component props must use `string` IDs
- Never use `number` for entity IDs

---

## 7. API Design

- Base prefix: `/api/v1`
- Routers: `menu`, `orders`, `chatbot`
- Auth router exists but is not mounted on the main app (Firebase handles auth client-side; the backend verifies Firebase ID tokens via `Authorization: Bearer <token>`)
- Health check: `GET /health` → `{ status, version }`
- Interactive docs: `/docs` (Swagger), `/redoc`

### CORS

Allowed origins are driven by `settings.ALLOWED_ORIGINS` (a `list[str]` from `.env`). Locally: `http://localhost:3000`. Production: `https://canteen-56f17.web.app` and `https://canteen-56f17.firebaseapp.com`.

---

## 8. Frontend Architecture

### API Client (`frontend/src/lib/api.ts`)

```ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  // ...
});
```

In production, `NEXT_PUBLIC_API_URL` is an empty string so `baseURL` is `""`, meaning all requests use the page's origin (`https://canteen-56f17.web.app`). Firebase Hosting rewrites `/api/v1/**` to Cloud Run.

### Routing (Firebase Hosting `firebase.json`)

```json
"rewrites": [
  { "source": "/api/v1/**", "run": { "serviceId": "canteen-backend", "region": "asia-south1" } },
  { "source": "**", "destination": "/index.html" }
]
```

Any change to `firebase.json` rewrites requires a `firebase deploy --only hosting` redeploy.

### Static Export

`next.config.js` uses `output: "export"`. The build emits static files to `frontend/out/`, which is the Firebase Hosting `public` directory. There is no Node.js server; all pages are pre-rendered.

---

## 9. Deployment

### Backend → Google Cloud Run

```bash
cd backend
bash deploy-backend.sh
```

The script:
1. Enables required GCP APIs (`run`, `artifactregistry`, `cloudbuild`)
2. Converts `backend/.env` to a YAML file (`/tmp/canteen_env.yaml`) using Python — handles JSON special characters in `FIREBASE_SERVICE_ACCOUNT_KEY`
3. Runs `gcloud run deploy canteen-backend` sourcing from the `backend/` directory with `--env-vars-file`
4. Cloud Build builds the Docker image and pushes to Artifact Registry (`asia-south1-docker.pkg.dev/canteen-56f17/...`)
5. Cloud Run creates a new revision and routes 100% traffic to it

**Important constraints:**
- Region is always `asia-south1`
- Service allows unauthenticated access (`--allow-unauthenticated`)
- MongoDB Atlas must have `0.0.0.0/0` whitelisted under Network Access (Cloud Run uses dynamic egress IPs)
- Min instances: 0 (cold starts possible), Max: 5 (production tunable)
- Container port: `8080` (Cloud Run standard)

To force a new revision without code changes:
```bash
gcloud run services update canteen-backend \
  --region asia-south1 \
  --project canteen-56f17 \
  --update-env-vars DEPLOY_TIMESTAMP=$(date +%s)
```

Check service status:
```bash
gcloud run services describe canteen-backend \
  --region asia-south1 \
  --project canteen-56f17 \
  --format "value(status.url,status.conditions[0].type,status.conditions[0].status)"
```

### Frontend → Firebase Hosting

```bash
# From repo root — always build with empty API URL first
cd frontend && NEXT_PUBLIC_API_URL= npm run build && cd ..
firebase deploy --only hosting --project canteen-56f17
```

Or using the Makefile + Firebase CLI directly. The build output in `frontend/out/` is uploaded.

### Docker Compose (Local Containers)

```bash
docker-compose up --build
```

Backend on `:8000`, frontend on `:3000`. Use `.env` files at root or pass vars via shell.

---

## 10. Code Style & Conventions

### Python (Backend)

- **Python 3.12** — use modern syntax (`list[str]`, `str | None`, `match` statements)
- **Pydantic v2** — use `model_validator`, `field_validator`; avoid v1 `@validator`
- **Beanie** — use `Document` for top-level collections; use `BaseModel` for embedded sub-documents
- **Async-first** — all route handlers and DB calls must be `async def`
- **Linting**: `ruff check app/` — fix all issues before committing
- **Formatting**: `ruff format app/` — enforced style
- **Imports**: absolute imports from `app.*` (e.g., `from app.core.config import settings`)
- Never call `settings = Settings()` directly — always use `get_settings()` (cached via `lru_cache`)

### TypeScript (Frontend)

- **Strict TypeScript** — no `any` without explicit justification
- **All IDs are `string`** — MongoDB ObjectIds are never `number`
- **React context** — `auth-context.tsx` for Firebase user, `cart-context.tsx` for cart state with reducer
- **Tailwind CSS** — utility classes only; no custom CSS unless unavoidable
- **Typography** — the sole typeface is **Lexend** (Google Fonts), loaded via `next/font/google` with weights 300–700. CSS variable: `--font-lexend`. Both `font-display` and `font-body` Tailwind utilities resolve to Lexend. Never introduce other typefaces (e.g. Playfair Display, DM Sans) — Lexend is the only font across the entire site.
- **Axios** — all API calls go through the `api` instance in `lib/api.ts`; never use `fetch` directly

### General

- Never hard-code secrets, API keys, or connection strings in source code
- Never commit `.env`, `.env.local`, `.venv/`, `node_modules/`, or `frontend/out/`
- Use `make` targets for all routine operations — do not run raw commands that bypass the Makefile

---

## 11. Dependency Management

### Adding a Python Package

```bash
source backend/.venv/bin/activate
pip install <package>
make -C backend freeze        # updates requirements.txt
```

### Adding a Node Package

```bash
cd frontend
npm install <package>         # updates package.json + package-lock.json
```

---

## 12. Common Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Backend startup fails with `SSL handshake failed` | MongoDB Atlas IP not whitelisted | Add `0.0.0.0/0` in Atlas → Network Access |
| Frontend shows DEMO_MENU (6 items) instead of real data | API call falling back to localhost | Check `NEXT_PUBLIC_API_URL` is empty in build; rebuild with `NEXT_PUBLIC_API_URL= npm run build` |
| `gcloud run deploy` fails with env var special chars | JSON in `FIREBASE_SERVICE_ACCOUNT_KEY` breaks `--set-env-vars` | Use `--env-vars-file` (handled by `deploy-backend.sh`) |
| Port 8000 already in use | Previous uvicorn not killed | `make -C backend dev` runs `kill` target automatically |
| `pydantic.ValidationError: id expected int` | Duplicate schema block with SQL-style int IDs | Check `schemas.py` for duplicate class definitions |
| Firebase deploy 403 on Cloud Run rewrite | Cloud Run Admin API not enabled / billing not linked | Enable billing + APIs; rewrite requires billing |
