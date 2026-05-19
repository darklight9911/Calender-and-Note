from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timezone

from app.models.models import AcademicNote, UserProfile
from app.schemas.schemas import AcademicNoteCreate, AcademicNoteRead
from app.api.v1.auth import get_current_user
from app.services.gemini_service import process_canvas_note

router = APIRouter(prefix="/notes", tags=["notes"])


def _to_read(note: AcademicNote) -> AcademicNoteRead:
    return AcademicNoteRead(
        id=str(note.id),
        user_id=note.user_id,
        title=note.title,
        raw_canvas_data=note.raw_canvas_data,
        extracted_text=note.extracted_text,
        ai_summary=note.ai_summary,
        action_items=note.action_items,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.get("/", response_model=List[AcademicNoteRead])
async def list_notes(current_user: UserProfile = Depends(get_current_user)):
    notes = await AcademicNote.find({"user_id": current_user.id}).sort("-created_at").to_list()
    return [_to_read(n) for n in notes]


@router.post("/", response_model=AcademicNoteRead, status_code=status.HTTP_201_CREATED)
async def create_note(
    payload: AcademicNoteCreate,
    current_user: UserProfile = Depends(get_current_user),
):
    """Process the canvas image with Gemini, then save the note."""
    try:
        analysis = process_canvas_note(payload.raw_canvas_data)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI processing error: {str(exc)}",
        )

    note = AcademicNote(
        user_id=current_user.id,
        title=payload.title,
        raw_canvas_data=payload.raw_canvas_data,
        extracted_text=analysis.extracted_text,
        ai_summary=analysis.ai_summary,
        action_items=analysis.action_items,
    )
    await note.insert()
    return _to_read(note)


@router.get("/{note_id}", response_model=AcademicNoteRead)
async def get_note(
    note_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    note = await AcademicNote.get(note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return _to_read(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    note = await AcademicNote.get(note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    await note.delete()
