# StudyMind — Hackathon Submission

> AI-Powered Academic Helper — Smart Calendar Scheduling + Canvas Note Intelligence, powered by Google Gemini

---

## 1. Project Name & Description

### StudyMind

**StudyMind** is a production-grade, full-stack AI academic assistant that transforms how students manage their academic schedule and handwritten notes using the power of Google Gemini.

### What It Does

StudyMind gives every student an AI study partner accessible from any device. It combines two Gemini-powered features:

- **AI Academic Calendar** — Students describe events in plain English ("schedule my physics exam on Friday at 2 PM") and Gemini instantly parses the intent into a structured calendar event ready to confirm and save. Full CRUD calendar with monthly view, category colour-coding (Exam, Assignment, Study Session, Class), and a natural-language chat interface.

- **Canvas Note Intelligence** — Students draw, sketch, or handwrite notes on an in-browser HTML5 canvas. On save, Gemini Vision multimodally processes the raw canvas image: extracting the handwritten text via OCR, generating an AI summary, and pulling out a structured action item list — all persisted to MongoDB for later review.

- **Dashboard** — A unified profile overview showing upcoming events, saved notes with AI summaries, and personal stats at a glance.

### The Problem It Solves

Students juggle exams, assignments, and study schedules across multiple subjects with no integrated AI assistance. Handwritten notes from lectures are lost or never reviewed. Calendar apps require manual structured input. The result:

- Missed deadlines from poor scheduling visibility
- Lecture notes that are never actioned or summarised
- No AI tool that understands the academic context of a student's workload
- Students paying for expensive tutoring/note-taking services they cannot afford

### The Value StudyMind Creates

| Stakeholder | Value |
|---|---|
| Students | Natural language scheduling; AI-transcribed and summarised handwritten notes; action items extracted automatically |
| Educators | Students arrive more prepared with AI-assisted note review; fewer "I missed the deadline" situations |
| Institutions | Democratised access to AI study tools — no premium subscription required |

---

## 2. Working Demo

**Live Deployed Application:** [https://canteen-56f17.web.app](https://canteen-56f17.web.app)

**Live Backend API / Docs:** [https://canteen-backend-885567530091.asia-south1.run.app/docs](https://canteen-backend-885567530091.asia-south1.run.app/docs)

### Demo Flow — AI Calendar

1. Visit the app → click **"Sign in with Google"**
2. Navigate to **Calendar** (`/calendar`)
3. In the AI chat sidebar, type: *"Add a Physics exam on next Monday at 10 AM"*
4. Gemini returns a structured draft event with category, title, and datetime pre-filled
5. Confirm the event — it appears on the monthly calendar grid instantly
6. Click any event cell to create, edit, or delete events manually

### Demo Flow — Canvas Notes

1. Navigate to **Notes** (`/notes`)
2. Pick a pen colour and draw or write anything on the dark canvas
3. Enter a title, click **"Save & Analyse"**
4. Gemini Vision processes the image: the note card appears in the sidebar with:
   - **Extracted Text** — OCR transcript of your handwriting
   - **AI Summary** — concise paragraph summary
   - **Action Items** — bullet list of tasks identified in the note

---

## 3. Source Code

**GitHub Repository:** <https://github.com/darklight9911/Calender-and-Note>

> The repository contains the complete monorepo:
> - `backend/` — FastAPI service (Python 3.12, Beanie ODM, Gemini AI)
> - `frontend/` — Next.js 16 static export (TypeScript, Tailwind CSS v4)
> - `docker-compose.yml` — local full-stack orchestration
> - `backend/deploy-backend.sh` — one-command Cloud Run deployment

---

## 4. Google Technologies Used

### Google Gemini API — Two Distinct AI Features

StudyMind uses **Gemini 2.5 Flash** in two fundamentally different ways via `backend/app/services/gemini_service.py`:

---

#### Feature 1 — Natural Language Calendar Scheduling (`parse_schedule_intent`)

Students type a plain English scheduling request. Gemini parses it into a fully structured calendar event using **structured JSON output** enforced by a Pydantic `response_schema`.

```python
# backend/app/services/gemini_service.py
prompt = (
    f"Current timestamp: {now_ctx}\n"
    f'Student request: "{message}"\n'
    "Extract the scheduling intent and return a structured calendar event."
)
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
        system_instruction=CALENDAR_SYSTEM_INSTRUCTION,
        response_mime_type="application/json",
        response_schema=StructuredCalendarEvent,
        temperature=0.1,
    ),
)
```

The `StructuredCalendarEvent` schema enforces: `title`, `description`, `start_time` (ISO 8601), `end_time`, and `category` (enum: Exam / Assignment / Study Session / Class / Other). The route handler then composes a human-readable `confirmation_message` and returns both as a `CalendarChatResponse` for the frontend to display.

**Input:** *"Remind me about my calculus assignment due Thursday at 11:59 PM"*
**Output:** Structured JSON → draft event card with one-click confirmation

---

#### Feature 2 — Canvas Note OCR + Intelligence (`process_canvas_note`)

Students draw or handwrite on the canvas. The raw PNG data URL is decoded and sent to Gemini as a binary image part for **multimodal vision processing**.

```python
# Decode base64 data URL → binary bytes
header, b64data = raw_canvas_data.split(",", 1)
image_bytes = base64.b64decode(b64data)

image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/png")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[image_part, text_part],
    config=types.GenerateContentConfig(
        system_instruction=NOTE_SYSTEM_INSTRUCTION,
        response_mime_type="application/json",
        response_schema=NoteAnalysisResponse,
        temperature=0.2,
    ),
)
```

The `NoteAnalysisResponse` schema returns: `extracted_text` (OCR), `ai_summary` (paragraph), `action_items` (list of strings). All three fields are persisted to MongoDB alongside the note.

**Key Gemini features leveraged:**
- **Structured Output (JSON mode)** — guaranteed schema compliance via `response_schema`
- **Multimodal Vision** — raw PNG image processed natively by Gemini
- **Instruction following** — tailored system prompts for each task

---

### Firebase Authentication

Students sign in via **Google OAuth** through Firebase Authentication. The Firebase client SDK handles the sign-in flow and issues a Firebase ID Token. Every API request to FastAPI includes `Authorization: Bearer <token>`. The backend verifies it using **Firebase Admin SDK** — fully stateless JWT authentication with no session storage.

**Features used:**
- Google Sign-In provider (OAuth 2.0)
- `onAuthStateChanged` listener in `AuthContext` for real-time session state
- Firebase ID Token verification in FastAPI (`firebase_admin.auth.verify_id_token`)

---

### Firebase Hosting

The Next.js frontend is compiled as a **static export** (`output: "export"`) and deployed to Firebase Hosting. A rewrite rule transparently proxies all `/api/v1/**` requests to the Cloud Run backend — enabling the frontend to use relative API paths with zero CORS complexity.

```json
"rewrites": [
  { "source": "/api/v1/**", "run": { "serviceId": "canteen-backend", "region": "asia-south1" } },
  { "source": "**", "destination": "/index.html" }
]
```

---

### Google Cloud Run

The FastAPI backend is containerised via a multi-stage Dockerfile and deployed to **Cloud Run** (`asia-south1`). Benefits:
- Auto-scaling from zero — no idle cost during off-peak hours
- Managed HTTPS with automatic TLS certificates
- Environment secrets injected at deploy time via `--env-vars-file` (no secrets in source)
- Single-command deployment:

```bash
cd backend && bash deploy-backend.sh
```

---

## 5. Prize Track(s)

| Track | Justification |
|---|---|
| **Best Use of Gemini API** | Gemini is used in two distinct modes: structured output for NLP calendar scheduling, and multimodal vision for handwritten note OCR and summarisation. Both are production-integrated with enforced Pydantic response schemas. |
| **Best App Deployed on Google Cloud** | The full stack runs on Google infrastructure: Cloud Run (FastAPI backend), Firebase Hosting (Next.js static export), Firebase Auth (Google OAuth identity). App is live at `https://canteen-56f17.web.app`. |

---

## 6. UN Sustainable Development Goals (SDGs)

StudyMind directly contributes to three SDGs:

---

### SDG 4 — Quality Education *(Primary)*

> *"Ensure inclusive and equitable quality education and promote lifelong learning opportunities."*

- **AI-powered academic organisation** — Natural language scheduling removes friction from deadline tracking, helping students stay on top of their workload
- **Democratised note intelligence** — Every student gets AI-quality note transcription and summarisation — capabilities previously only available via expensive services or personal tutors
- **Better learning outcomes** — AI-extracted action items from lecture notes create clear next steps, closing the gap between passive note-taking and active revision
- **Reduced cognitive overload** — Students focus on understanding content rather than manually organising it, supporting deeper learning

---

### SDG 3 — Good Health and Well-Being

> *"Ensure healthy lives and promote well-being for all at all ages."*

- **Academic stress reduction** — Missed deadlines and disorganised study schedules are leading drivers of student anxiety. StudyMind directly reduces this through AI-assisted scheduling
- **Mental health support** — A structured, AI-maintained schedule gives students a sense of control over their academic lives, reducing overwhelm
- **Accessible support** — Students who cannot afford tutors or note-taking services receive equivalent AI-powered academic support

---

### SDG 10 — Reduced Inequalities

> *"Reduce inequality within and among countries."*

- **Equal access to AI tools** — Premium note-summarisation and AI scheduling tools cost students hundreds of dollars per year. StudyMind provides this for free, levelling the playing field between students from different socioeconomic backgrounds
- **Language accessibility** — Natural language input means students of all writing styles and abilities can interact with the AI without structured formatting requirements

---

## 7. Technical Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     STUDENT BROWSER                         │
│  Next.js 16 (Static Export) · Firebase Hosting             │
│  React 19 · TypeScript · Tailwind CSS v4 · Framer Motion   │
│                                                             │
│  /calendar  — Monthly grid + AI scheduling chat            │
│  /notes     — HTML5 canvas + note library with AI results  │
│  /dashboard — Profile, stats, upcoming events              │
└─────────────────┬───────────────────────────────────────────┘
                  │ Firebase ID Token (JWT)
                  │ HTTPS (Hosting rewrite → Cloud Run)
┌─────────────────▼───────────────────────────────────────────┐
│                    FASTAPI BACKEND                           │
│  Google Cloud Run · asia-south1 · Docker (Python 3.12)      │
│                                                             │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ Firebase     │  │  GeminiService  │  │  Beanie ODM   │  │
│  │ Admin SDK    │  │  gemini-2.5-    │  │  Motor +      │  │
│  │ token verify │  │  flash          │  │  MongoDB      │  │
│  │ (stateless)  │  │  · structured   │  │  Atlas        │  │
│  └──────────────┘  │  · multimodal   │  └───────────────┘  │
│                    └─────────────────┘                      │
│                                                             │
│  Routes: /api/v1/calendar/  ·  /api/v1/calendar/chat/parse │
│          /api/v1/notes/                                     │
└─────────────────────────────────────────────────────────────┘
```

**Data flow — AI Calendar Chat:**
1. Student types *"add a stats exam Friday 3 PM"* in the chat sidebar
2. `POST /api/v1/calendar/chat/parse` → FastAPI verifies Firebase token
3. `GeminiService.parse_schedule_intent()` calls Gemini with structured output schema
4. Gemini returns `StructuredCalendarEvent` JSON (title, times, category, confirmation_message)
5. Frontend shows draft event banner → student clicks Confirm → `POST /api/v1/calendar/` saves to MongoDB

**Data flow — Canvas Note Analysis:**
1. Student draws on canvas → clicks **"Save & Analyse"**
2. Canvas exported as `image/png` base64 data URL
3. `POST /api/v1/notes/` → FastAPI calls `GeminiService.process_canvas_note()`
4. Gemini Vision processes PNG → returns `extracted_text` + `ai_summary` + `action_items`
5. Note saved to MongoDB; sidebar updates with AI-enriched note card

---

## 8. Team

*(Add team member names, roles, and GitHub/LinkedIn profiles here)*

---

*Built for a Google-sponsored hackathon · May 2026*
