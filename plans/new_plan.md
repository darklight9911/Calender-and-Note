Pivot noted! Shifting the focus to an AI Academic Helper works beautifully with your chosen stack. Next.js is perfect for interactive components like digital calendars and canvas layouts, FastAPI handles the background processing pipelines, and Gemini 1.5/2.5 Flash models are ideal for multi-modal processing (like reading hand-drawn notes) and high-speed text summarization.
Here is the updated blueprint, features, and the master system prompt designed specifically for this new architecture.
The Core Feature Ecosystem
Instead of an isolated chatbot, the AI acts as a backend service engine running beneath three interconnected client modules:
1. Smart Academic Calendar
• Manual & Chat Ingestion: You can click a calendar day and type in an event manually, or just talk to the side-panel chat agent ("Hey, add an exam for CSE 311 on Friday from 10 AM to 12 PM, and block out the evening before for cramming").
• Natural Language Event Parsing: The backend extracts dates, times, titles, and descriptions, converting unstructured chat messages into valid JSON objects to populate your calendar database.
2. Multi-Modal Note & Drawing Canvas
• Handwritten Processing: Utilizing the HTML5 Canvas API in Next.js, you can sketch diagrams or handwrite text.
• Gemini Vision Pipeline: When you click "Save Note," the frontend exports the canvas as a base64 Data URL (PNG/JPEG) and routes it to FastAPI. FastAPI fires it off to Gemini's native multimodal API endpoint to OCR-translate the handwriting and parse visual diagrams.
• Automatic AI Summarization: Along with raw extraction, the AI simultaneously attaches a concise, structured markdown summary (Key Concepts, Formula Cheat-sheet, Actions Items) to that note's database entry.
3. Unified Contextual Chatbot
• Contextual Queries: The chatbot stays visible on the layout and is fully aware of what you are viewing. If you are looking at the calendar, it assists with scheduling. If you are looking at a specific math note, it acts as a tutor for that exact topic.
Professional Database Schema Updates (SQLAlchemy)
To accommodate calendars and notes, swap out the canteen schema for this relational layout in your backend/app/models/models.py:
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class UserProfile(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)  # Firebase UID
    email = Column(String, unique=True)

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    category = Column(String)  # e.g., "Exam", "Assignment", "Study Session"

class AcademicNote(Base):
    __tablename__ = "academic_notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    raw_canvas_data = Column(Text)  # Stores JSON structure or Cloud Storage link for sketches
    extracted_text = Column(Text)   # Gemini translated handwriting
    ai_summary = Column(Text)       # Auto-generated AI summary breakdown

Master Development Prompt: AI Academic Helper
Copy and paste this prompt into your AI coding editor to build the updated system structure:
Act as a Senior Full-Stack Cloud Engineer. Build an AI-Powered Academic Helper Application using Next.js (App Router, Tailwind CSS), FastAPI (Python), Cloud Run, Firebase App Hosting, Firebase Auth (Google Sign-in), and the Google AI Studio Gemini API using the `google-genai` SDK.

The platform requires a highly professional development project directory matching standard enterprise structures (separate frontend/ and backend/ workspaces).

Key Application Modules:
1. Academic Calendar Dashboard: A responsive interactive grid calendar. Users can create, modify, or delete events manually via click-modals. A localized side-panel chatbot must accept natural language queries (e.g., "Schedule a study session for math tomorrow at 4pm") and convert them into structured event additions.
2. Note & Canvas Drawing Board: An HTML5 sketchpad interface enabling digital drawing, sketching, and handwriting. On clicking 'Save', the app must send the canvas image data to the FastAPI backend.
3. FastAPI Gemini Engine:
   - Event Parsing: Route 'POST /api/v1/calendar/chat' to Gemini using Structured Outputs to return JSON containing title, start_time, end_time, and description.
   - Hand-Drawn Note Ingestion: Route 'POST /api/v1/notes/process' to Gemini using multi-modal capabilities. The model must process the raw image binary, convert handwriting into markdown text, and automatically generate an academic summary featuring definitions, core formulas, and action items.

Enforce clean separation of concerns. Secure all API gateways with Firebase Authentication ID token checks using the `firebase-admin` Python framework.

Gemini Implementation Core (FastAPI)
Here is how you handle both the text scheduling parsing and multimodal canvas processing in your new backend/app/services/gemini_service.py file using the official SDK:
import io
from google import genai
from google.genai import types
from pydantic import BaseModel
from datetime import datetime

client = genai.Client()

# --- CALENDAR TEXT PARSING ---
class StructuredEvent(BaseModel):
    title: str
    description: str
    start_time: str # ISO Format
    end_time: str   # ISO Format
    category: str

def parse_schedule_intent(user_message: str) -> StructuredEvent:
    current_time_ctx = datetime.now().isoformat()
    prompt = f"Extract scheduling data from: '{user_message}'. Current timestamp context is {current_time_ctx}."
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="You are a scheduling assistant. Convert loose scheduling text into structured calendar data objects.",
            response_mime_type="application/json",
            response_schema=StructuredEvent,
        ),
    )
    return response.text

# --- MULTIMODAL CANVAS SUMMARY ---
class NoteAnalysisResponse(BaseModel):
    extracted_handwriting: str
    conceptual_summary: str
    action_items: list[str]

def process_handwritten_canvas(image_bytes: bytes) -> NoteAnalysisResponse:
    # Package image data into the format expected by the SDK
    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type="image/png"
    )
    
    prompt = "Transcribe all handwriting or textual notes in this image perfectly. Then, generate a high-quality conceptual academic summary and list any explicit tasks or deadlines found."
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[image_part, prompt],
        config=types.GenerateContentConfig(
            system_instruction="You are an advanced academic OCR and transcription system. Extract and organize handwritten sketches cleanly.",
            response_mime_type="application/json",
            response_schema=NoteAnalysisResponse,
        )
    )
    return response.text

This stack keeps you entirely within the Google Free Tier (Firebase App Hosting, Cloud Run, and Google AI Studio), completely removing your reliance on third-party AI subscription services while providing premium multi-modal workflows.