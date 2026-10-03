from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.services.service_session import delete_session
from app.supabase_db.session import get_db
from app.core.config import settings

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post("/logout")
def logout(
    request: Request,
    db: Session = Depends(get_db)
):
    session_id = request.cookies.get("regforge_session")

    if session_id:
        delete_session(db, session_id)

    response = Response(
        content='{"message": "Logged out successfully"}',
        media_type="application/json"
    )

    response.delete_cookie(
        key="regforge_session",
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        path="/"
    )

    return response