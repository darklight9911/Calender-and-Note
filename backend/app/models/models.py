from beanie import Document
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import enum


class EventCategory(str, enum.Enum):
    EXAM = "Exam"
    ASSIGNMENT = "Assignment"
    STUDY_SESSION = "Study Session"
    CLASS = "Class"
    OTHER = "Other"


# ── Top-level documents ─────────────────────────────────────────────────────

class UserProfile(Document):
    id: str  # Firebase UID used as MongoDB _id
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    class Settings:
        name = "user_profiles"


class CalendarEvent(Document):
    user_id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    category: EventCategory = EventCategory.OTHER
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    class Settings:
        name = "calendar_events"


class AcademicNote(Document):
    user_id: str
    title: str
    raw_canvas_data: Optional[str] = None   # base64 data URL (PNG)
    extracted_text: Optional[str] = None
    ai_summary: Optional[str] = None
    action_items: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    class Settings:
        name = "academic_notes"
