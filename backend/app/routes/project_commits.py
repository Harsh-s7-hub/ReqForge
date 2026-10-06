from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.models.github_repositories import GitHubRepository
from app.models.project import Project
from app.auth.github_app import generate_installation_token
from app.services.github_commit_service import GitHubCommitService
from app.services.service_session import get_current_user
from app.supabase_db.session import get_db


router = APIRouter(
    prefix="/api/projects",
    tags=["Project Commits"],
)


@router.get("/{project_id}/commits")
async def get_project_commits(
    project_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(db, request)

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    repository = (
        db.query(GitHubRepository)
        .filter(
            GitHubRepository.id == project.repository_id,
        )
        .first()
    )

    if repository is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub repository not found.",
        )

    full_name = repository.full_name

    if not full_name or "/" not in full_name:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub repository information.",
        )

    owner, repository_name = full_name.split("/", 1)

    installation_id = repository.installation.installation_id

    if not installation_id:
        raise HTTPException(
            status_code=400,
            detail="GitHub App installation not available.",
        )

    try:
        access_token = await generate_installation_token(
            installation_id
        )

        service = GitHubCommitService()

        commits =  service.get_commits(
            owner=owner,
            repository=repository_name,
            access_token=access_token,
        )

        return {
            "project_id": project_id,
            "repository": full_name,
            "commits": commits,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc