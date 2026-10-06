from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.github_app import generate_installation_token
from app.models.github_repositories import GitHubRepository
from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis
from app.services.github_commit_service import GitHubCommitService
from app.services.project_analysis_service import ProjectAnalysisService
from app.services.service_session import get_current_user
from app.supabase_db.session import get_db


router = APIRouter(
    prefix="/api/projects",
    tags=["Project Analysis"],
)


@router.post("/{project_id}/analyze")
async def analyze_project(
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

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    repository = (
        db.query(GitHubRepository)
        .filter(
            GitHubRepository.id == project.repository_id,
        )
        .first()
    )

    if not repository:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    if not repository.github_installation_id:
        raise HTTPException(
            status_code=400,
            detail="GitHub App installation not found",
        )

    if not repository.default_branch:
        raise HTTPException(
            status_code=400,
            detail="Repository default branch not found",
        )

    installation_token = await generate_installation_token(
        repository.installation.installation_id
    )

    full_name = repository.full_name

    if "/" not in full_name:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub repository full_name",
        )

    owner, repository_name = full_name.split("/", 1)

    commit_service = GitHubCommitService()

    commits = commit_service.get_commits(
        owner=owner,
        repository=repository_name,
        access_token=installation_token,
    )

    if not commits:
        raise HTTPException(
            status_code=404,
            detail="No commits found for repository",
        )

    commit_sha = commits[0]["sha"]

    service = ProjectAnalysisService(db)

    analysis = service.analyze_project(
        project=project,
        repository=repository,
        commit_sha=commit_sha,
        github_token=installation_token,
    )

    return {
        "id": analysis.id,
        "project_id": analysis.project_id,
        "commit_sha": analysis.commit_sha,
        "analysis_number": analysis.analysis_number,
        "status": analysis.status,
    }


@router.get("/{project_id}/analysis/{analysis_id}")
def get_analysis(
    project_id: int,
    analysis_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(db, request)

    # Verify that the project belongs to the
    # currently authenticated user.
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

    # Only allow access to an analysis belonging
    # to this project.
    analysis = (
        db.query(ProjectAnalysis)
        .filter(
            ProjectAnalysis.id == analysis_id,
            ProjectAnalysis.project_id == project_id,
        )
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    return {
        "id": analysis.id,
        "project_id": analysis.project_id,
        "commit_sha": analysis.commit_sha,
        "analysis_number": analysis.analysis_number,
        "parent_analysis_id": analysis.parent_analysis_id,
        "status": analysis.status,
        "files_scanned": analysis.files_scanned,
        "files_parsed": analysis.files_parsed,
        "files_failed": analysis.files_failed,
        "unsupported_files": analysis.unsupported_files,
        "parse_errors": analysis.parse_errors,
        "started_at": analysis.started_at,
        "completed_at": analysis.completed_at,
    }