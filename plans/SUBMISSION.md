# CampusEats — Hackathon Submission

> Smart Campus Canteen Management System powered by Google Gemini AI

---

## 1. Project Name & Description

### CampusEats

**CampusEats** is a production-grade, full-stack smart campus canteen platform that transforms the everyday student meal experience from a generic queue-based process into an intelligent, health-aware food ordering system.

### What It Does

CampusEats combines a conventional e-commerce food ordering interface with an embedded AI nutritionist named **Nora**, powered by Google Gemini. Students can:

- **Browse** a live daily canteen menu with calorie counts, macronutrients, prep times, and allergen tags
- **Order** meals through a familiar shopping-cart checkout flow
- **Chat** with Nora — the AI campus dietitian — for personalised meal guidance
- **Manage** a health profile (allergies, daily calorie limits) that Nora references in real time
- **Receive proactive alerts** if items in their cart conflict with their allergen profile or calorie budget

Admin staff can manage the live menu inventory (add, update, toggle availability) via a protected dashboard.

### The Problem It Solves

Campus canteens serve hundreds of students daily, yet almost no digital infrastructure exists to bridge the gap between what food is available and what a specific student **should** eat. Students with dietary restrictions, allergies, or fitness goals are left to manually read labels or guess. The result is:

- Students with allergies accidentally ordering unsafe food
- Poor nutritional choices due to lack of guidance
- Food waste from ordering incorrect or undesired meals
- Long queues from indecision at the counter

### The Value CampusEats Creates

| Stakeholder | Value |
|---|---|
| Students | Personalised, AI-guided meal planning; instant allergen safety checks; calorie-aware ordering |
| Canteen Staff | Real-time digital menu management; live inventory reflected instantly in AI recommendations |
| Campus Administration | Reduced food waste; health and wellness data insights; modernised canteen operations |

---

## 2. Working Demo

**Live Deployed Application:** [https://canteen-56f17.web.app](https://canteen-56f17.web.app)

**Live Backend API / Docs:** [https://canteen-backend-885567530091.asia-south1.run.app/docs](https://canteen-backend-885567530091.asia-south1.run.app/docs)

### Demo Flow

1. Visit the landing page — click **"Explore Today's Menu"**
2. Sign in with your Google account (Firebase Authentication)
3. Browse the menu — view calories, macros, and ingredient details per item
4. Click **"Ask the AI Dietitian"** to open the Nora chat panel
5. Ask Nora: *"I have 600 calories left and I'm avoiding gluten — what should I eat?"*
6. Nora returns structured recommendations as interactive cards with **"Add to Cart"** buttons
7. Add items to cart — Nora proactively alerts you if any cart item triggers an allergen
8. Complete checkout — your order is persisted in MongoDB and the status updates live

---

## 3. Source Code

**GitHub Repository:** *(add your repo URL here)*

> The repository contains the complete monorepo:
> - `backend/` — FastAPI service (Python 3.12)
> - `frontend/` — Next.js 15 static export (TypeScript)
> - `docker-compose.yml` — local full-stack orchestration
> - `backend/deploy-backend.sh` — one-command Cloud Run deployment
> - `backend/seed.py` — MongoDB seed script with realistic campus menu data

---

## 4. Google Technologies Used

### Google Gemini API — AI Nutritionist ("Nora")

**How it's used:**

The heart of CampusEats is the `GeminiService` (`backend/app/services/gemini_service.py`), which calls **Gemini 2.5 Flash** with structured output enforcement via Pydantic schemas.

Every chat request passes the AI:
- The student's full health profile (allergies, daily calorie limit)
- The student's current shopping cart contents
- The **entire live canteen inventory** (only `is_available: true` items) as context

Gemini returns a strictly typed JSON response defined by `AIChatbotResponse`, which includes:
- `conversational_reply` — friendly, specific 1–3 sentence response
- `recommended_items` — up to 4 items with exact `item_id`s the frontend uses to render interactive food cards
- `warnings_or_allergen_alerts` — named, specific warnings (e.g., "⚠ Masala Oatmeal Bowl contains oats — excluded due to your gluten allergy.")
- `cart_alert` — proactive alert if the current cart conflicts with the student's profile
- `order_intent` — populated when the student uses purchase language ("order me", "I'll have"), triggering a one-tap confirmation flow

**Key Gemini features leveraged:**
- **Structured Output (JSON mode)** — guaranteed schema compliance using Pydantic `response_schema`
- **Long context window** — the full menu inventory + chat history fits in a single prompt
- **Instruction following** — a 4-pillar system prompt covering Health & Safety, E-commerce Integration, Conversational Intelligence, and Order Placement

```python
# backend/app/services/gemini_service.py (excerpt)
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=contents,
    config=types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        response_mime_type="application/json",
        response_schema=AIChatbotResponse,
        temperature=0.7,
    ),
)
```

---

### Firebase Authentication

**How it's used:**

Students sign in via **Google OAuth** through Firebase Authentication. The Firebase client SDK (`frontend/src/lib/firebase.ts`) handles the sign-in flow and issues a Firebase ID Token. Every API request to FastAPI includes this token as `Authorization: Bearer <token>`. The backend verifies it using **Firebase Admin SDK** without any database round-trip — fully stateless JWT authentication.

**Features used:**
- Google Sign-In provider (OAuth 2.0)
- `onAuthStateChanged` listener in `AuthContext` for real-time session management
- Firebase ID Token verification in FastAPI (`firebase_admin.auth.verify_id_token`)

---

### Firebase Hosting

**How it's used:**

The Next.js frontend is compiled as a **static export** (`output: "export"`) and deployed to Firebase Hosting. A Firebase Hosting rewrite rule transparently proxies all `/api/v1/**` requests to the Cloud Run backend, enabling the frontend to use relative API paths in production with zero CORS complexity.

```json
// firebase.json
"rewrites": [
  { "source": "/api/v1/**", "run": { "serviceId": "canteen-backend", "region": "asia-south1" } },
  { "source": "**", "destination": "/index.html" }
]
```

---

### Google Cloud Run

**How it's used:**

The FastAPI backend is containerised via a multi-stage Dockerfile and deployed to **Cloud Run** in `asia-south1`. Cloud Run provides:
- Auto-scaling from zero (cold-start aware) to handle peak lunch-hour traffic spikes
- Managed HTTPS with automatic TLS certificates
- Seamless integration with Firebase Hosting rewrites
- Environment secrets injected at deploy time via `--env-vars-file` (no secrets in source)

Deployment is a single script execution:
```bash
cd backend && bash deploy-backend.sh
```

---

### Google AI Studio

Used during development to prototype and tune the Nora system prompt, test structured output schemas, and benchmark Gemini 2.5 Flash responses across real campus-meal scenarios before integrating into production.

---

## 5. Prize Track(s)

| Track | Justification |
|---|---|
| **Best Use of Gemini API** | Gemini is the core intelligence layer — structured output, live context injection, allergen logic, and order intent detection are all Gemini-driven. The AI transforms a standard food app into a personalised health concierge. |
| **Best App Deployed on Google Cloud** | The full stack runs on Google infrastructure: Cloud Run (backend), Firebase Hosting (frontend), Firebase Auth (identity). Production deployment is automated and the app is live at `https://canteen-56f17.web.app`. |

---

## 6. UN Sustainable Development Goals (SDGs)

CampusEats directly contributes to four SDGs:

---

### SDG 2 — Zero Hunger

> *"End hunger, achieve food security and improved nutrition, and promote sustainable agriculture."*

**How CampusEats contributes:**

- **Reduced food waste** — Students know exactly what they are ordering (with accurate descriptions, images, and macros) before ordering, reducing cancelled or untouched meals
- **Better food access planning** — Real-time menu availability prevents students from walking to the canteen only to find their preferred meal sold out
- **Allergen safety** — Students with dietary restrictions gain safe, reliable access to canteen food they can trust, preventing exclusion from communal meals

---

### SDG 3 — Good Health and Well-Being

> *"Ensure healthy lives and promote well-being for all at all ages."*

**How CampusEats contributes:**

This is the **primary SDG** CampusEats targets.

- **AI-powered nutrition guidance** — Nora, the AI dietitian, guides students toward calorie-appropriate, macro-balanced meals based on their individual health profiles
- **Allergen protection** — Zero-exposure allergen filtering prevents accidental ingestion of allergens (a serious health risk for students with conditions like celiac disease or anaphylaxis)
- **Calorie & macro budgeting** — Students can set daily calorie limits and receive AI feedback when their cart exceeds them, supporting weight management and fitness goals
- **Dietary lifestyle enforcement** — Vegan, vegetarian, halal, keto, and low-sodium preferences are automatically respected, supporting diverse health and lifestyle needs of a campus population
- **Informed food choices** — Every menu item displays full macronutrients (protein, carbs, fat) and ingredient lists, enabling genuinely informed eating decisions — a key pillar of preventive healthcare

---

### SDG 4 — Quality Education

> *"Ensure inclusive and equitable quality education and promote lifelong learning opportunities."*

**How CampusEats contributes:**

- **Student welfare supports academic performance** — Poor nutrition is a documented barrier to concentration and cognitive performance. CampusEats' pre-exam meal suggestions ("something light that won't make me sleepy for my 2 PM exam") directly support student academic outcomes
- **Health literacy** — Through daily interactions with Nora, students learn about macronutrients, allergens, and dietary categories — building lasting nutritional literacy
- **Equal access to dietary support** — Students who cannot afford a personal nutritionist gain equivalent, AI-powered dietary guidance at no additional cost

---

### SDG 12 — Responsible Consumption and Production

> *"Ensure sustainable consumption and production patterns."*

**How CampusEats contributes:**

- **Reduced over-ordering and food waste** — AI-assisted meal planning nudges students toward right-sized portions and appropriate quantities, reducing leftover waste at the canteen level
- **Live inventory management** — Canteen staff update item availability in real time; the AI immediately stops recommending out-of-stock items, aligning demand with supply and reducing overproduction
- **Conscious consumption** — Surfacing detailed nutritional and ingredient information promotes more deliberate, mindful purchasing decisions rather than impulsive ordering

---

## 7. Technical Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     STUDENT BROWSER                         │
│  Next.js 15 (Static Export) · Firebase Hosting             │
│  React 19 · TypeScript · Tailwind CSS · Framer Motion       │
└─────────────────┬───────────────────────────────────────────┘
                  │ Firebase ID Token (JWT)
                  │ HTTPS (via Hosting rewrite → Cloud Run)
┌─────────────────▼───────────────────────────────────────────┐
│                    FASTAPI BACKEND                           │
│  Google Cloud Run · asia-south1 · Docker (Python 3.12)      │
│                                                             │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ Firebase     │  │  GeminiService  │  │  Beanie ODM   │  │
│  │ Admin SDK    │  │  (gemini-2.5-   │  │  (Motor +     │  │
│  │ (token verify│  │   flash,        │  │   MongoDB     │  │
│  │  stateless)  │  │   structured    │  │   Atlas)      │  │
│  └──────────────┘  │   output)       │  └───────────────┘  │
│                    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

**Data flow for an AI chat message:**
1. Student types a message in the Nora chat panel
2. Frontend sends `POST /api/v1/chatbot/chat` with the Firebase ID Token
3. FastAPI verifies the token → fetches the student's `UserProfile` + current cart + full live menu
4. `GeminiService` calls `gemini-2.5-flash` with the system prompt, student context, and menu data
5. Gemini returns structured JSON (`AIChatbotResponse`) — guaranteed schema via Pydantic `response_schema`
6. FastAPI returns the response; the frontend renders `recommended_items` as interactive food cards with working "Add to Cart" buttons

---

## 8. Team

*(Add team member names, roles, and GitHub/LinkedIn profiles here)*

---

*Built for a Google-sponsored hackathon · May 2026*
