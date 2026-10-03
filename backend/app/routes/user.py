from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.supabase_db.session import get_db
from app.services.service_session import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/api/users", 
    tags=["Users"]
)

@router.get("/me")
def get_my_profile(
    request:Request,
    db:Session = Depends(get_db)
):
    current_user = get_current_user(db,request)
    return {
       "authenticated": True,
        "user": {
            "id": current_user.id,
            "github_id": current_user.github_id,
            "github_username": current_user.github_username,
            "name": current_user.name,
            "avatar_url": current_user.avatar_url,
            "profile_url": current_user.profile_url
        }
    }