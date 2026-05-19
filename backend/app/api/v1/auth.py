from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
import json
from datetime import datetime, timezone, timedelta

from app.core.config import settings
from app.models.models import UserProfile, CalendarEvent, AcademicNote, EventCategory

bearer_scheme = HTTPBearer()

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    if not firebase_admin._apps:
        key_str = settings.FIREBASE_SERVICE_ACCOUNT_KEY
        if key_str:
            try:
                key_dict = json.loads(key_str)
                cred = credentials.Certificate(key_dict)
            except (json.JSONDecodeError, ValueError):
                cred = credentials.Certificate(key_str)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
    _firebase_initialized = True


async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Validate Firebase ID token and return decoded token claims."""
    _init_firebase()
    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please re-authenticate.",
        )
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
        )


async def _seed_new_user(uid: str) -> None:
    """Create demo calendar events and a sample note for brand-new accounts."""
    now = datetime.now(timezone.utc).replace(hour=9, minute=0, second=0, microsecond=0)

    demo_events = [
        CalendarEvent(
            user_id=uid,
            title="Calculus II Final Exam",
            description="Chapters 7-12. Bring calculator and formula sheet.",
            start_time=now + timedelta(days=3),
            end_time=now + timedelta(days=3, hours=2),
            category=EventCategory.EXAM,
        ),
        CalendarEvent(
            user_id=uid,
            title="Machine Learning — Assignment 3",
            description="Implement a neural network classifier on MNIST. Submit via GitHub.",
            start_time=now + timedelta(days=5),
            end_time=now + timedelta(days=5, hours=1),
            category=EventCategory.ASSIGNMENT,
        ),
        CalendarEvent(
            user_id=uid,
            title="Operating Systems Lecture",
            description="Topic: Virtual Memory & Page Replacement Algorithms",
            start_time=now + timedelta(days=1),
            end_time=now + timedelta(days=1, hours=1, minutes=30),
            category=EventCategory.CLASS,
        ),
        CalendarEvent(
            user_id=uid,
            title="Study Group — Algorithms",
            description="Library room 204. Cover dynamic programming problems.",
            start_time=now + timedelta(days=2, hours=5),
            end_time=now + timedelta(days=2, hours=7),
            category=EventCategory.STUDY_SESSION,
        ),
        CalendarEvent(
            user_id=uid,
            title="Physics Lab Report Due",
            description="Submit online via LMS before midnight.",
            start_time=now + timedelta(days=7),
            end_time=now + timedelta(days=7, hours=1),
            category=EventCategory.ASSIGNMENT,
        ),
    ]

    demo_note = AcademicNote(
        user_id=uid,
        title="Sorting Algorithms — Quick Reference",
        extracted_text=(
            "Merge Sort: O(n log n) time, O(n) space. Stable. Divide array in half, "
            "recursively sort, merge. Great for linked lists.\n\n"
            "Quick Sort: O(n log n) average, O(n²) worst. In-place. Choose pivot, partition. "
            "Faster in practice due to cache locality.\n\n"
            "Heap Sort: O(n log n) time, O(1) space. Not stable. Build max-heap then extract.\n\n"
            "Insertion Sort: O(n²) worst, O(n) best (nearly sorted). Stable, in-place. "
            "Good for small or almost-sorted arrays."
        ),
        ai_summary=(
            "Four fundamental comparison-based sorting algorithms. Merge Sort is best for "
            "stability and linked lists; Quick Sort is fastest in practice for arrays; "
            "Heap Sort gives O(1) extra space; Insertion Sort wins on nearly-sorted small inputs."
        ),
        action_items=[
            "Implement merge sort from scratch without looking at notes",
            "Practice quick sort with different pivot strategies (first, last, median)",
            "Compare time complexity for n=10, 100, 1000 elements",
        ],
    )

    for event in demo_events:
        await event.insert()
    await demo_note.insert()


async def get_current_user(
    token_data: dict = Depends(verify_firebase_token),
) -> UserProfile:
    """Fetch or auto-create UserProfile document using Firebase UID."""
    uid = token_data.get("uid")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="UID missing from token.")

    user = await UserProfile.get(uid)

    if user is None:
        user = UserProfile(
            id=uid,
            email=token_data.get("email", ""),
            display_name=token_data.get("name"),
            photo_url=token_data.get("picture"),
        )
        await user.insert()
        await _seed_new_user(uid)

    return user


async def require_admin(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required.",
        )
    return current_user
