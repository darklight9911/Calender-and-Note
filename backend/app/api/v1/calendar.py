from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timezone

from app.models.models import CalendarEvent, UserProfile
from app.schemas.schemas import (
    CalendarEventCreate,
    CalendarEventRead,
    CalendarEventUpdate,
    CalendarChatRequest,
    CalendarChatResponse,
)
from app.api.v1.auth import get_current_user
from app.services.gemini_service import parse_schedule_intent

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _to_read(event: CalendarEvent) -> CalendarEventRead:
    return CalendarEventRead(
        id=str(event.id),
        user_id=event.user_id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        category=event.category,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


# ── CRUD ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[CalendarEventRead])
async def list_events(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    current_user: UserProfile = Depends(get_current_user),
):
    query: dict = {"user_id": current_user.id}
    if month and year:
        from_dt = datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            to_dt = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            to_dt = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        query["start_time"] = {"$gte": from_dt, "$lt": to_dt}
    events = await CalendarEvent.find(query).sort("start_time").to_list()
    return [_to_read(e) for e in events]


@router.post("/", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: CalendarEventCreate,
    current_user: UserProfile = Depends(get_current_user),
):
    event = CalendarEvent(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        start_time=payload.start_time,
        end_time=payload.end_time,
        category=payload.category,
    )
    await event.insert()
    return _to_read(event)


@router.get("/{event_id}", response_model=CalendarEventRead)
async def get_event(
    event_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    event = await CalendarEvent.get(event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return _to_read(event)


@router.patch("/{event_id}", response_model=CalendarEventRead)
async def update_event(
    event_id: str,
    payload: CalendarEventUpdate,
    current_user: UserProfile = Depends(get_current_user),
):
    event = await CalendarEvent.get(event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    update_data = payload.model_dump(exclude_none=True)
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await event.set(update_data)
    return _to_read(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    event = await CalendarEvent.get(event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    await event.delete()


# ── AI Scheduling Chat ──────────────────────────────────────────────────────

@router.post("/chat/parse", response_model=CalendarChatResponse)
async def parse_calendar_chat(
    request: CalendarChatRequest,
    _user: UserProfile = Depends(get_current_user),
):
    """Parse a natural language scheduling message into a structured event draft."""
    try:
        result = parse_schedule_intent(request.message)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI scheduling service error: {str(exc)}",
        )
