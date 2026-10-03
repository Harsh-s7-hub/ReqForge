import hashlib
import secrets
from datetime import datetime,timedelta,timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, Request
from app.models.user import User
from app.models.user_session import UserSession
from app.core.config import settings
from typing import Final

SESSION_EXPIRY_DAYS : Final[int] = settings.SESSION_EXPIRY_DAYS

def generate_session_id() -> str:
    return secrets.token_urlsafe(32)

def hash_session_id(session_id:str) ->str:
    return hashlib.sha256(
        session_id.encode("utf-8")
    ).hexdigest()


def create_session(
        db:Session,
        user_id:int
) -> str:
    session_id = generate_session_id()

    session_hash = hash_session_id(session_id)

    session = UserSession(
        user_id=user_id,
        session_id_hash=session_hash,
        expires_at=(
            datetime.now(timezone.utc)
            + timedelta(days=SESSION_EXPIRY_DAYS)
        )
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session_id


def delete_session(db:Session,session_id:str) -> None:
    session_hash = hash_session_id(session_id)
    session = (
        db.query(UserSession)
        .filter(UserSession.session_id_hash==session_hash)
        .first()
    )

    if session:
        db.delete(session)
        db.commit()

    return


def get_current_user(db: Session, request: Request) -> User:
    
    session_id = request.cookies.get("regforge_session")

    if not session_id:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated."
        )

    
    session_hash = hash_session_id(session_id)

    
    session = (
        db.query(UserSession)
        .filter(UserSession.session_id_hash == session_hash)
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=401,
            detail="Invalid session."
        )

    
    if session.expires_at <= datetime.now(timezone.utc):
        db.delete(session)
        db.commit()

        raise HTTPException(
            status_code=401,
            detail="Session expired. Please log in again."
        )

    
    user = db.query(User).filter(
        User.id == session.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found."
        )

    return user

