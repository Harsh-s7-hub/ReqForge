from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.github_app import generate_installation_token
from app.models.github_repositories import GitHubRepository
from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis
from app.services.project_analysis_service import ProjectAnalysisService
from app.services.service_session import get_current_user
from app.supabase_db.session import get_db


router = APIRouter(
    prefix="/api/projects",
    tags=["Project Commit Analysis"],
)


@router.post("/{project_id}/analyze-commit/{commit_sha}")
async def analyze_commit(
    project_id: int,
    commit_sha: str,
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
            GitHubRepository.id == project.repository_id
        )
        .first()
    )

    if repository is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found.",
        )

    if not repository.github_installation_id:
        raise HTTPException(
            status_code=400,
            detail="GitHub App installation is not available.",
        )

    if len(commit_sha) != 40:
        raise HTTPException(
            status_code=400,
            detail="Invalid commit SHA.",
        )

    # Reuse an existing analysis for this exact commit.
    existing_analysis = (
        db.query(ProjectAnalysis)
        .filter(
            ProjectAnalysis.project_id == project_id,
            ProjectAnalysis.commit_sha == commit_sha,
        )
        .order_by(ProjectAnalysis.id.desc())
        .first()
    )

    if existing_analysis:
        return {
            "id": existing_analysis.id,
            "project_id": existing_analysis.project_id,
            "commit_sha": existing_analysis.commit_sha,
            "analysis_number": existing_analysis.analysis_number,
            "status": existing_analysis.status,
            "existing": True,
        }

    installation_token = await generate_installation_token(
        repository.installation.installation_id
    )

    service = ProjectAnalysisService(db)

    analysis = service.analyze_project(
        project=project,
        repository=repository,
        commit_sha=commit_sha,
        github_token=installation_token,
        update_current=False,
    )

    return {
        "id": analysis.id,
        "project_id": analysis.project_id,
        "commit_sha": analysis.commit_sha,
        "analysis_number": analysis.analysis_number,
        "status": analysis.status,
        "existing": False,
    }