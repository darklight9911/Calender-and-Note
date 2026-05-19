from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
import json

from app.core.config import settings
from app.models.models import UserProfile

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
