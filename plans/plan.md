Here is a comprehensive, professional Master Development Prompt. You can copy and paste this directly into an AI coding assistant (like Project IDX, Cursor, or Gemini) to generate the structural framework and core logic for your application.
Master Development Prompt: Smart Campus Canteen Management System
1. Project Overview & System Role
Act as a Senior Full-Stack Cloud Architect and Lead Software Engineer. Your goal is to build a professional, full-stack Student Canteen Management System that looks and functions like a conventional modern e-commerce application (with menu browsing, categories, explicit cart management, and checkout operations), but seamlessly integrates an AI Nutritionist/Concierge Agent powered by the Google AI Studio Gemini API.
The application must not look like a generic chatbot platform. The UI must emphasize food imagery, dynamic menus, and simple ordering workflows, with the AI agent living in an expandable side panel or contextual widget to assist with allergen filtering and caloric boundaries.
2. Technical Stack Specifications
• Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Lucide React (for iconography).
• Frontend Hosting: Firebase App Hosting (supporting Server-Side Rendering & Server Actions natively).
• Backend: FastAPI (Python), Uvicorn, Pydantic v2.
• Backend Hosting: Google Cloud Run (Containerized via Docker).
• Database: PostgreSQL (Relational schema to enforce nested food-to-ingredient matrices).
• Authentication: Firebase Auth (Google Sign-In integration provider).
• AI SDK: Production-ready google-genai library (accessing gemini-2.5-flash or gemini-1.5-flash from Google AI Studio).
3. Professional Project Directory Structure
Generate the codebase strictly following this decoupled repository structure:
campus-canteen/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth.py          # Firebase token validation dependency
│   │   │   │   ├── menu.py          # Menu items CRUD (Canteen Admin & Student views)
│   │   │   │   ├── orders.py        # Cart processing and order submittals
│   │   │   │   └── chatbot.py       # AI Studio Gemini API orchestration
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic BaseSettings for Env Variables
│   │   │   └── database.py          # SQLAlchemy engine and session initialization
│   │   ├── models/
│   │   │   └── models.py            # SQLAlchemy Base DB classes (User, Item, Ingredient, Order)
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic v2 schemas for request validation & serialization
│   │   ├── services/
│   │   │   └── gemini_service.py    # Business logic for interacting with google-genai
│   │   └── main.py                  # FastAPI entry point & CORS configuration
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Layout including global Navbar & Cart Context
│   │   │   ├── page.tsx             # Marketing landing page
│   │   │   ├── menu/
│   │   │   │   └── page.tsx         # Conventional Grid Menu with embedded AI panel
│   │   │   ├── cart/
│   │   │   │   └── page.tsx         # Dedicated checkout overview page
│   │   │   └── dashboard/
│   │   │       └── page.tsx         # Canteen Admin panel (Add/Update menu items)
│   │   ├── components/
│   │   │   ├── ui/                  # Reusable UI primitives (Buttons, Cards, Modals)
│   │   │   ├── menu-card.tsx        # Individual meal items displaying macros/calories
│   │   │   ├── ai-concierge.tsx     # Smooth expandable sidebar for AI meal interaction
│   │   │   └── cart-drawer.tsx      # Standard slider showing added food entries
│   │   ├── context/
│   │   │   ├── auth-context.tsx     # Handles Firebase user session tokens
│   │   │   └── cart-context.tsx     # Handles item additions, modifications, and totals
│   │   └── lib/
│   │       └── api.ts               # Axios/Fetch client config linking to FastAPI Cloud Run
│   ├── package.json
│   └── tailwind.config.js

4. UI/UX Paradigm & Layout Guidelines
• The Main View: A classic e-commerce grid layout displaying food cards categorized by meal types (Breakfast, Lunch, Snacks). Each food card explicitly displays a high-quality image, price, calorie counter, and a prominent "Add to Cart" button.
• The AI Placement: Provide a floating action button in the bottom right corner labeled "Ask Campus Dietitian" or a clean right-side split screen widget on the /menu route.
• Actionable AI Output: When the AI recommends food items, it should not output a boring text list. The backend must provide structured IDs, and the frontend component (ai-concierge.tsx) must catch those IDs and render miniature, clickable versions of your standard e-commerce food cards directly inside the assistant panel.
5. Relational Database Schema (SQLAlchemy/PostgreSQL)
Ensure your data generation models follow this precise relational design to accommodate ingredients and calories:
# Create equivalent database models using SQLAlchemy syntax
class UserProfile(Base):
    id = Column(String, primary_key=True)  # Firebase UID
    email = Column(String, unique=True)
    allergies = Column(ARRAY(String))     # e.g., ['peanuts', 'gluten']
    daily_calorie_limit = Column(Integer, default=2000)

class MenuItem(Base):
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    calories = Column(Integer, nullable=False)
    protein = Column(Integer)
    carbs = Column(Integer)
    fat = Column(Integer)
    is_available = Column(Boolean, default=True)
    ingredients = relationship("Ingredient", back_populates="menu_item", cascade="all, delete-orphan")

class Ingredient(Base):
    id = Column(Integer, primary_key=True)
    menu_item_id = Column(Integer, ForeignKey("menuitem.id"))
    name = Column(String, nullable=False)  # e.g., "Peanut Oil", "Whole Wheat Flour"

6. AI Agent System Prompt & Structured Output Configuration
Implement the AI connection inside backend/app/services/gemini_service.py using the official google-genai SDK. You must configure the model to interpret student metrics and cross-reference them with the database menu array, enforcing Structured Outputs via Pydantic response types.
Required FastAPI Implementation Skeleton:
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import List

# Define the precise schema the frontend needs to render interactive item actions
class AIRecommendedItem(BaseModel):
    item_id: int
    item_name: str
    reason_for_recommendation: str

class AIChatbotResponse(BaseModel):
    conversational_reply: str
    recommended_items: List[AIRecommendedItem]
    warnings_or_allergen_alerts: List[str]

def consult_gemini_dietitian(user_prompt: str, user_profile: dict, current_menu: list) -> AIChatbotResponse:
    # Initialize client (looks for GEMINI_API_KEY environment variable naturally)
    client = genai.Client()
    
    system_instruction = (
        "You are an expert Campus Nutritionist and Culinary Assistant. Your job is to guide students "
        "to choose meals from the provided canteen menu based on their specific health goals, dietary restrictions, "
        "and allergies. Cross-reference the ingredient list of every food item against the user's allergy array. "
        "If an item contains an allergen or violates their remaining calorie balance, exclude it entirely or issue an explicit warning."
    )
    
    context_payload = f"""
    STUDENT PROFILE:
    - Allergies: {user_profile['allergies']}
    - Calorie Boundary limit: {user_profile['daily_calorie_limit']}
    
    TODAY'S CANTEEN MENU DATA:
    {current_menu}
    
    STUDENT REQUEST:
    "{user_prompt}"
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=context_payload,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=AIChatbotResponse,
            temperature=0.2
        )
    )
    
    # Return parsed response object matching the structured model
    return response.text

7. Execution Blueprint
Generate code sequentially across these operational phases:
1. Phase 1: Set up the global Next.js configuration and base Tailwind styles. Create mock-up versions of the standard menu grid page and basic static layout.
2. Phase 2: Build out the core FastAPI backend skeleton containing the database connection setup, validation handlers, and standard menu endpoints (GET /menu, POST /menu).
3. Phase 3: Integrate client-side Firebase Auth hooks with Google Sign-In and implement the verification router middleware on the FastAPI gateway layers.
4. Phase 4: Write out the Gemini chatbot endpoints, implementing the structured data schema and mounting the expandable AI UI panels directly to the Next.js e-commerce interface. Ensure that when a recommendation returns, clicking it directly calls the local addToCart() function.