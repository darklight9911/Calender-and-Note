from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum


class EventCategory(str, Enum):
    EXAM = "Exam"
    ASSIGNMENT = "Assignment"
    STUDY_SESSION = "Study Session"
    CLASS = "Class"
    OTHER = "Other"


# ── CalendarEvent Schemas ────────────────────────────────────────────────────

class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    category: EventCategory = EventCategory.OTHER


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    category: Optional[EventCategory] = None


class CalendarEventRead(CalendarEventBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None


# ── Calendar AI Chat Schemas ─────────────────────────────────────────────────

class CalendarChatRequest(BaseModel):
    message: str


class CalendarChatResponse(BaseModel):
    event: CalendarEventCreate
    confirmation_message: str


# ── AcademicNote Schemas ─────────────────────────────────────────────────────

class AcademicNoteCreate(BaseModel):
    title: str
    raw_canvas_data: str  # base64 data URL


class AcademicNoteRead(BaseModel):
    id: str
    user_id: str
    title: str
    raw_canvas_data: Optional[str] = None
    extracted_text: Optional[str] = None
    ai_summary: Optional[str] = None
    action_items: List[str] = []
    created_at: datetime
    updated_at: Optional[datetime] = None


# ── Gemini Internal Schemas (structured output) ──────────────────────────────

class StructuredCalendarEvent(BaseModel):
    """Used as Gemini response_schema for structured output."""
    title: str
    description: str
    start_time: str   # ISO 8601
    end_time: str     # ISO 8601
    category: str


class NoteAnalysisResponse(BaseModel):
    """Used as Gemini response_schema for multimodal note processing."""
    extracted_text: str
    ai_summary: str
    action_items: List[str]



