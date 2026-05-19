import base64
import json
from datetime import datetime

from google import genai
from google.genai import types

from app.schemas.schemas import (
    CalendarEventCreate,
    CalendarChatResponse,
    NoteAnalysisResponse,
    StructuredCalendarEvent,
    EventCategory,
)
from app.core.config import settings


CALENDAR_SYSTEM_INSTRUCTION = """You are an intelligent academic scheduling assistant.
Convert the student's natural language scheduling request into a structured calendar event.

Rules:
1. Infer dates relative to the provided current timestamp context (ISO 8601).
2. Map the event to one of these categories exactly: Exam, Assignment, Study Session, Class, Other.
3. If start_time or end_time cannot be determined, default to 1-hour blocks.
4. Return ONLY valid JSON matching the required schema — never plain text.
5. All datetime values must be ISO 8601 strings with timezone offset (e.g. 2026-05-19T14:00:00+05:30).
"""

NOTE_SYSTEM_INSTRUCTION = """You are an advanced academic OCR and study assistant.
Given a handwritten or drawn canvas image:
1. Transcribe all visible text and annotate any diagrams found.
2. Generate a structured academic summary with key concepts and formulas.
3. List any explicit action items, tasks, or deadlines found in the notes.
Return ONLY valid JSON matching the required schema.
"""


def parse_schedule_intent(message: str) -> CalendarChatResponse:
    """Use Gemini structured output to parse a natural language scheduling message."""
    client = genai.Client(api_key=settings.GEMINI_API_KEY or None)
    now_ctx = datetime.now().isoformat()

    prompt = (
        f"Current timestamp: {now_ctx}\n"
        f"Student request: \"{message}\"\n"
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

    data = json.loads(response.text)

    # Normalise category to enum value
    raw_cat = data.get("category", "Other")
    try:
        category = EventCategory(raw_cat)
    except ValueError:
        category = EventCategory.OTHER

    event = CalendarEventCreate(
        title=data["title"],
        description=data.get("description", ""),
        start_time=datetime.fromisoformat(data["start_time"]),
        end_time=datetime.fromisoformat(data["end_time"]),
        category=category,
    )

    confirmation = (
        f"I've prepared a \"{category.value}\" event: "
        f"\"{event.title}\" from "
        f"{event.start_time.strftime('%b %d, %H:%M')} to "
        f"{event.end_time.strftime('%H:%M')}. "
        "Confirm to add it to your calendar."
    )

    return CalendarChatResponse(event=event, confirmation_message=confirmation)


def process_canvas_note(raw_canvas_data: str) -> NoteAnalysisResponse:
    """Use Gemini multimodal to OCR and summarise a base64 canvas image."""
    client = genai.Client(api_key=settings.GEMINI_API_KEY or None)

    # Extract raw bytes from data URL: data:image/png;base64,<data>
    if "," in raw_canvas_data:
        _, encoded = raw_canvas_data.split(",", 1)
    else:
        encoded = raw_canvas_data
    image_bytes = base64.b64decode(encoded)

    image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/png")
    text_part = (
        "Transcribe all handwriting and text visible in this academic canvas image. "
        "Then generate a structured summary with key concepts, formulas, and action items."
    )

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

