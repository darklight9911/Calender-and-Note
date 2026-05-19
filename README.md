# Campus Canteen — Smart Campus Canteen Management System

A production-grade, full-stack food-ordering platform with an AI nutritionist powered by Google Gemini.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Frontend hosting | Firebase App Hosting |
| Backend | FastAPI (Python 3.12), Uvicorn, Pydantic v2 |
| Backend hosting | Google Cloud Run (Docker) |
| Database | PostgreSQL 16 + SQLAlchemy (async) |
| Auth | Firebase Auth (Google Sign-In) |
| AI | Google Gemini 2.5 Flash (structured output) |

## Project Structure

```
campus-canteen/
├── backend/          # FastAPI service
├── frontend/         # Next.js application
└── docker-compose.yml
```

## Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.12+

### 1. Clone & configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in: DATABASE_URL, GEMINI_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_KEY

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Fill in: NEXT_PUBLIC_FIREBASE_* values
```

### 2. Run with Docker Compose

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3. Run services individually

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Google Sign-In**
3. Generate a **Service Account Key** (Project Settings → Service accounts) and put the JSON in `FIREBASE_SERVICE_ACCOUNT_KEY`
4. Copy the Web App config values into the frontend `.env.local`

## Gemini API Key

1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Create an API key and set it as `GEMINI_API_KEY` in the backend `.env`

## Admin Access

Set `is_admin = true` on a `UserProfile` row in the database to grant dashboard access.

## Deployment

### Backend → Cloud Run

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/campus-canteen-backend ./backend
gcloud run deploy campus-canteen-backend \
  --image gcr.io/PROJECT_ID/campus-canteen-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=...,GEMINI_API_KEY=...
```

### Frontend → Firebase App Hosting

```bash
cd frontend
firebase deploy --only hosting
```
