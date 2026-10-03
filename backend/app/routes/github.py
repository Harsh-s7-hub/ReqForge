
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.service_session import get_current_user
from app.services.github_repository_query_service import (
    get_user_repositories,
)
from app.supabase_db.session import get_db


router = APIRouter(
    prefix="/api/github",
    tags=["GitHub"],
)


@router.get("/repositories")
def list_github_repositories(
    request: Request,
    db: Session = Depends(get_db),
):
    current_user: User = get_current_user(db, request)

    repositories = get_user_repositories(
        db=db,
        user_id=current_user.id,
    )

    return {
        "success": True,
        "count": len(repositories),
        "repositories": [
            {
                "id": repo.id,
                "github_repo_id": repo.github_repo_id,
                "name": repo.name,
                "full_name": repo.full_name,
                "owner_login": repo.owner_login,
                "is_private": repo.is_private,
                "html_url": repo.html_url,
                "default_branch": repo.default_branch,
            }
            for repo in repositories
        ],
    }
