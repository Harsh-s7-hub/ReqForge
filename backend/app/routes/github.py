from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.github_app import get_installation_url
from app.core.config import settings
from app.models.github_installation import GitHubInstallation
from app.models.user import User
from app.models.github_repositories import GitHubRepository
from app.services.github_installation_service import (
    fetch_installation_repositories,
)
from app.services.github_repositories_service import (
    sync_github_repositories, reconcile_github_repositories,
)
from app.services.github_repository_query_service import (
    get_user_repositories,
)
from app.services.service_session import get_current_user
from app.supabase_db.session import get_db


router = APIRouter(
    prefix="/api/github",
    tags=["GitHub"],
)


@router.get("/app-info")
def get_github_app_info(
    request: Request,
    db: Session = Depends(get_db),
):
    current_user: User = get_current_user(
        db,
        request,
    )

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.user_id == current_user.id,
            GitHubInstallation.is_active.is_(True),
        )
        .first()
    )

    return {
        "success": True,
        "installed": installation is not None,
        "app_slug": settings.GITHUB_APP_SLUG,
        "installation_url": get_installation_url(),
        "installation_id": (
            installation.installation_id
            if installation
            else None
        ),
        "account_login": (
            installation.account_login
            if installation
            else None
        ),
        "account_type": (
            installation.account_type
            if installation
            else None
        ),
    }


@router.get("/repositories")
def list_github_repositories(
    request: Request,
    db: Session = Depends(get_db),
):
    current_user: User = get_current_user(
        db,
        request,
    )

    repositories = get_user_repositories(
        db=db,
        user_id=current_user.id,
    )

    return {
        "success": True,
        "count": len(repositories),
        "repositories": [
            {
                "id": repository.id,
                "github_repo_id": repository.github_repo_id,
                "name": repository.name,
                "full_name": repository.full_name,
                "owner_login": repository.owner_login,
                "is_private": repository.is_private,
                "html_url": repository.html_url,
                "default_branch": repository.default_branch,
                "last_github_activity_at": (
                    repository.last_github_activity_at.isoformat()
                    if repository.last_github_activity_at
                    else None
                ),
            }
            for repository in repositories
        ],
    }

@router.get("/setup")
async def github_setup(
    installation_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user: User = get_current_user(
        db,
        request,
    )

    if installation_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub installation ID.",
        )

    # Find the existing installation.
    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.installation_id
            == installation_id,
        )
        .first()
    )

    # If this installation already belongs to another
    # RegForge user, do not allow it to be claimed.
    if installation:
        if installation.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "This GitHub installation belongs "
                    "to another user."
                ),
            )

        installation.is_active = True

        db.commit()

    # Fetch the CURRENT repository list from GitHub.
    #
    # This happens even when the installation already exists.
    # Therefore adding/removing repositories from the GitHub
    # App installation page is reflected in RegForge.
    try:
        repositories = await fetch_installation_repositories(
            installation_id
        )

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                "Unable to fetch the current GitHub "
                "repositories."
            ),
        ) from exc

    # If the installation does not exist yet,
    # create it for the currently authenticated user.
    if not installation:
        account_login = (
            current_user.github_username
        )
        account_type = "User"
        account_id = None

        if repositories:
            first_repository = repositories[0]

            owner = (
                first_repository.get("owner")
                or {}
            )

            account_login = (
                owner.get("login")
                or account_login
            )

            account_type = (
                owner.get("type")
                or account_type
            )

            account_id = owner.get("id")

        installation = GitHubInstallation(
            installation_id=installation_id,
            user_id=current_user.id,
            account_id=account_id,
            account_login=account_login,
            account_type=account_type,
            is_active=True,
        )

        db.add(installation)
        db.commit()
        db.refresh(installation)

    # IMPORTANT:
    #
    # Always reconcile the COMPLETE repository list.
    #
    # GitHub is treated as the source of truth.
    sync_message = reconcile_github_repositories(
        db=db,
        installation_id=installation_id,
        repositories=repositories,
    )

    return {
        "success": True,
        "username": current_user.github_username,
        "installation_id": installation_id,
        "repository_count": len(repositories),
        "message": sync_message,
    }


@router.delete("/repositories/{repository_id}")
def delete_github_repository(
    repository_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user: User = get_current_user(
        db,
        request,
    )

    repository = (
        db.query(GitHubRepository)
        .join(
            GitHubInstallation,
            GitHubRepository.github_installation_id
            == GitHubInstallation.id,
        )
        .filter(
            GitHubRepository.id == repository_id,
            GitHubInstallation.user_id == current_user.id,
            GitHubInstallation.is_active.is_(True),
            GitHubRepository.is_active.is_(True),
        )
        .first()
    )

    if not repository:
        raise HTTPException(
            status_code=404,
            detail="Repository not found.",
        )

    repository.is_active = False

    db.commit()

    return {
        "success": True,
        "message": "Repository removed from RegForge.",
        "repository_id": repository.id,
    }