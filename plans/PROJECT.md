# CampusEats — Smart Campus Canteen

Full-stack food ordering platform with an AI nutritionist chatbot.
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
  │     ├── Context API    →  AuthContext, CartContext
  │     └── Axios          →  calls FastAPI with Bearer token
  │
  └── FastAPI (port 8000)
        ├── Firebase Admin  →  verify ID tokens
        ├── Beanie / Motor  →  MongoDB Atlas (ODM + async driver)
        └── Google GenAI    →  Gemini 2.5 Flash structured output
```

All auth is stateless JWT: the frontend obtains a Firebase ID token after Google Sign-In, sends it as `Authorization: Bearer <token>` on every request, and the backend verifies it via Firebase Admin SDK.

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
| make | any | pre-installed on macOS |

> MongoDB and Redis are **not** run locally — they live in MongoDB Atlas (cloud).

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
   - `menu_items`
   - `orders`

### 2. Firebase

#### 2a. Create project & web app
1. Go to <https://console.firebase.google.com> → **Add project**.
2. Inside the project → **Project settings** → **Your apps** → **Add app** → Web.
3. Register the app and copy these four values into frontend `.env.local`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`

#### 2b. Enable Google Sign-In
1. **Authentication** → **Sign-in method** → **Google** → **Enable** → Save.
2. **Authentication** → **Settings** → **Authorized domains** → confirm `localhost` is listed (it is by default).

#### 2c. Service Account (backend)
1. **Project settings** → **Service accounts** → **Generate new private key**.
2. Download the JSON file.
3. Minify it to a single line (remove all newlines) and paste the whole thing as the value of `FIREBASE_SERVICE_ACCOUNT_KEY` in `backend/.env`.  
   Quick minify: `python3 -c "import json,sys; print(json.dumps(json.load(open('serviceAccount.json'))))"  `

### 3. Google AI (Gemini)

1. Go to <https://aistudio.google.com/app/apikey>.
2. Click **Create API key** → copy it.
3. Paste it as `GEMINI_API_KEY` in `backend/.env`.

---

## Environment Variables

### Backend — `backend/.env`

Create this file (copy from `backend/.env.example`):

```env
# ── MongoDB Atlas ──────────────────────────────────────────────────────────────
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# ── Firebase Admin SDK ────────────────────────────────────────────────────────
FIREBASE_PROJECT_ID=your-firebase-project-id
# Paste the full service-account JSON as a single-line string:
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

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
# 1. Clone / enter the repo
cd Canteen_app

# 2. Install ALL dependencies (backend venv + frontend node_modules)
make install

# 3. Create env files
cp backend/.env.example   backend/.env       # fill in your values
cp frontend/.env.local.example frontend/.env.local  # fill in your values
```

### Run both services

```bash
# From the repo root — starts backend on :8000 and frontend on :3000
make dev
```

Or run them individually:

```bash
# Backend only (auto-reload)
cd backend && make dev

# Frontend only (Turbopack)
cd frontend && make dev
```

### Useful Make targets

| Command | What it does |
|---|---|
| `make install` | Create `.venv`, install Python deps + `npm install` |
| `make dev` | Start backend (:8000) + frontend (:3000) concurrently |
| `cd backend && make dev` | Backend only with hot-reload |
| `cd backend && make run` | Backend production mode (2 workers) |
| `cd backend && make lint` | Run ruff linter |
| `cd backend && make format` | Run ruff formatter |
| `cd frontend && make dev` | Frontend only (Turbopack) |
| `cd frontend && make build` | Production Next.js build |
| `cd frontend && make lint` | ESLint |

### Verify it's working

```bash
# Backend health
curl http://localhost:8000/health
# → {"status":"healthy","version":"1.0.0"}

# Interactive API docs
open http://localhost:8000/docs

# Frontend
open http://localhost:3000
```

---

## Project Structure

```
Canteen_app/
├── Makefile                   # root orchestrator (install / dev)
├── docker-compose.yml         # Docker stack
├── firebase.json              # Firebase Hosting config + Cloud Run rewrite
├── .firebaserc                # Firebase project alias
├── README.md
├── plans/
│   ├── PROJECT.md             # this file
│   ├── plan.md
│   ├── chatbot.md
│   └── SUBMISSION.md
│
├── backend/
│   ├── .env                   # ← YOU CREATE THIS (see env section)
│   ├── requirements.txt       # pinned Python dependencies
│   ├── seed.py                # one-shot MongoDB seed script
│   ├── deploy-backend.sh      # Cloud Run deployment script
│   ├── Makefile
│   ├── Dockerfile             # multi-stage Python 3.12 build
│   └── app/
│       ├── main.py            # FastAPI app, CORS, lifespan hooks
│       ├── api/v1/
│       │   ├── auth.py        # Firebase token verification, get_current_user, require_admin
│       │   ├── menu.py        # CRUD for menu items (admin-gated writes)
│       │   ├── orders.py      # Order creation, status updates, admin list
│       │   └── chatbot.py     # POST /chat → Gemini dietitian (Nora)
│       ├── core/
│       │   ├── config.py      # Pydantic settings (reads .env via lru_cache)
│       │   └── database.py    # Motor client, Beanie init (uses certifi TLS)
│       ├── models/
│       │   └── models.py      # Beanie Documents: UserProfile, MenuItem, Order
│       ├── schemas/
│       │   └── schemas.py     # Pydantic I/O schemas (Base/Create/Read pattern)
│       └── services/
│           └── gemini_service.py  # Gemini 2.5 Flash with structured JSON output
│
└── frontend/
    ├── .env.local             # ← YOU CREATE THIS (see env section)
    ├── .env.production        # NEXT_PUBLIC_API_URL=" " (empty for static export)
    ├── package.json
    ├── next.config.js         # output: "export", static to frontend/out/
    ├── tailwind.config.js
    ├── Makefile
    ├── Dockerfile
    └── src/
        ├── app/
        │   ├── layout.tsx     # Root layout, Lexend font, providers
        │   ├── page.tsx       # Landing / home page
        │   ├── menu/page.tsx  # Menu browsing + add to cart
        │   ├── cart/page.tsx  # Cart review + checkout
        │   └── dashboard/page.tsx  # Order history + user profile
        ├── components/
        │   ├── navbar.tsx
        │   ├── menu-card.tsx
        │   ├── cart-drawer.tsx
        │   ├── ai-concierge.tsx   # AI chatbot panel
        │   └── ui/
        │       ├── Button.tsx
        │       ├── Card.tsx
        │       └── Modal.tsx
        ├── context/
        │   ├── auth-context.tsx   # Firebase Auth state, Google sign-in
        │   └── cart-context.tsx   # Cart items, totals
        └── lib/
            ├── api.ts         # Axios instance, auto-attaches Bearer token
            ├── firebase.ts    # Firebase app init, auth, googleProvider
            └── utils.ts       # cn() helper, misc utilities
```

---

## API Reference

Base URL: `http://localhost:8000`  
Auth: `Authorization: Bearer <firebase-id-token>` on all protected routes.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Liveness check |

### Menu — `/api/v1/menu`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/menu/` | No | List menu items (filter: `?category=lunch&available_only=true`) |
| GET | `/api/v1/menu/{id}` | No | Get single item |
| POST | `/api/v1/menu/` | Admin | Create menu item |
| PATCH | `/api/v1/menu/{id}` | Admin | Update menu item |
| DELETE | `/api/v1/menu/{id}` | Admin | Delete menu item |

**Categories**: `breakfast` `lunch` `dinner` `snacks` `beverages`

### Orders — `/api/v1/orders`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/orders/` | User | Place a new order |
| GET | `/api/v1/orders/` | User | List current user's orders (sorted newest first) |
| GET | `/api/v1/orders/admin/all` | Admin | List all orders across all users |
| GET | `/api/v1/orders/{id}` | User | Get order detail |
| PATCH | `/api/v1/orders/{id}` | Admin | Update order status |

**Order statuses**: `pending` → `confirmed` → `preparing` → `ready` → `completed` / `cancelled`

### AI Chatbot — `/api/v1/chat`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/chat/` | User | Chat with Nora the AI dietitian |

**Request body**:
```json
{
  "message": "What's a high-protein lunch under 600 kcal?",
  "history": [
    { "role": "user", "content": "I'm allergic to nuts." },
    { "role": "assistant", "content": "Got it, I'll avoid all nut-based items." }
  ]
}
```

**Response**:
```json
{
  "conversational_reply": "Based on today's menu...",
  "recommended_items": [
    { "item_id": "...", "name": "Grilled Chicken Bowl", "reason": "32g protein, 520 kcal" }
  ],
  "warnings_or_allergen_alerts": []
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

Build and run the full stack with Docker Compose.  
Create a `.env` in the repo root with the variables that `docker-compose.yml` expects:

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

---

## Deployment Notes

### Production URLs

| Service | URL |
|---|---|
| Frontend (Firebase Hosting) | `https://canteen-56f17.web.app` |
| Backend (Cloud Run) | `https://canteen-backend-885567530091.asia-south1.run.app` |
| GCP / Firebase project | `canteen-56f17` |
| Cloud Run service | `canteen-backend` (region: `asia-south1`) |

### Backend → Google Cloud Run

```bash
cd backend
bash deploy-backend.sh
```

The script converts `backend/.env` → `/tmp/canteen_env.yaml` (safely handles JSON in `FIREBASE_SERVICE_ACCOUNT_KEY`), then runs `gcloud run deploy` with `--env-vars-file`. Cloud Build builds the Docker image and pushes to Artifact Registry.

**Important constraints:**
- Region is always `asia-south1`
- Service allows unauthenticated access (`--allow-unauthenticated`)
- MongoDB Atlas must have `0.0.0.0/0` whitelisted (Cloud Run uses dynamic egress IPs)
- Container port: `8080` (Cloud Run standard)

Force a new revision without code changes:
```bash
gcloud run services update canteen-backend \
  --region asia-south1 --project canteen-56f17 \
  --update-env-vars DEPLOY_TIMESTAMP=$(date +%s)
```

### Frontend → Firebase Hosting

```bash
# Always build with empty API URL so axios uses relative paths (rewritten by Firebase)
cd frontend && NEXT_PUBLIC_API_URL= npm run build && cd ..
firebase deploy --only hosting --project canteen-56f17
```

Build output lands in `frontend/out/` — the Firebase Hosting `public` directory. Firebase rewrites `/api/v1/**` to Cloud Run and `**` to `/index.html`.

> **Critical:** `.env.local` always overrides `.env.production` in Next.js. Always pass `NEXT_PUBLIC_API_URL=` explicitly when building for production.

### Other Notes

- **MongoDB URL**: the production URL includes `?tls=true` via `mongodb+srv://`. The Motor client is configured with `tlsCAFile=certifi.where()` — no extra flags needed.
- **Firebase service account key**: pass as a single-line JSON string via `FIREBASE_SERVICE_ACCOUNT_KEY` — no file mounting required.
- **CORS**: production `ALLOWED_ORIGINS` includes `https://canteen-56f17.web.app` and `https://canteen-56f17.firebaseapp.com`.
- **Admin users**: there is no sign-up flow for admins. Set `is_admin: true` directly in MongoDB Atlas after the user first logs in (which auto-creates their profile).
