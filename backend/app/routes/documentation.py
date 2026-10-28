from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.documentation.schemas.documentation import (
    DocumentationCatalogResponse,
    DocumentationCommitRequest,
    DocumentationCommitResponse,
    DocumentationContentUpdate,
    DocumentationGenerationResponse,
    DocumentationStatusResponse,
    DocumentationVersionResponse,
)
from app.auth.github_app import generate_installation_token
from app.documentation.services.documentation_service import DocumentationService
from datetime import datetime, timezone
from app.documentation.services.documentation_stale_service import DocumentationStaleService
from app.models.github_repositories import GitHubRepository
from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis
from app.models.project_documentation import ProjectDocumentation
from app.services.github_commit_service import GitHubCommitService
from app.services.project_token_service import ProjectTokenService
from app.services.service_session import get_current_user
from app.supabase_db.session import get_db
from app.workers.documentation.dispatch import dispatch_generation_job


router = APIRouter(prefix="/api/projects", tags=["Documentation"])
catalog_router = APIRouter(prefix="/api/documentation", tags=["Documentation"])


def _get_owned_project(db: Session, request: Request, project_id: int) -> Project:
    current_user = get_current_user(db, request)
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project


@router.post(
    "/{project_id}/analysis/{analysis_id}/documentation/generate",
    response_model=DocumentationGenerationResponse,
    status_code=202,
)
def generate_documentation(
    project_id: int,
    analysis_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    project = _get_owned_project(db, request, project_id)
    analysis = (
        db.query(ProjectAnalysis)
        .filter(ProjectAnalysis.id == analysis_id, ProjectAnalysis.project_id == project.id)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    if analysis.status != "completed":
        raise HTTPException(status_code=409, detail="Documentation requires a completed analysis.")

    service = DocumentationService(db)
    try:
        documentation, version, job = service.queue_generation(
            project=project,
            analysis=analysis,
        )
        dispatch_generation_job(db, job)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail="Documentation queue is unavailable.") from exc

    return DocumentationGenerationResponse(
        documentation_id=documentation.id,
        version_id=version.id,
        job_id=job.id,
        status="queued",
    )


@router.get(
    "/{project_id}/documentation/status",
    response_model=DocumentationStatusResponse,
)
def get_documentation_status(
    project_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    _get_owned_project(db, request, project_id)
    return DocumentationStaleService.get_status(db, project_id)


@router.get("/{project_id}/action-token")
def get_project_action_token(
    project_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    project = _get_owned_project(db, request, project_id)
    token = ProjectTokenService.generate_token(project)
    return {
        "project_id": project.id,
        "token": token,
        "token_prefix": "rf_proj",
    }


@router.get("/{project_id}/documentation/versions", response_model=list[DocumentationVersionResponse])
def list_documentation_versions(project_id: int, request: Request, db: Session = Depends(get_db)):
    _get_owned_project(db, request, project_id)
    return DocumentationService(db).list_versions(project_id)


@router.get("/{project_id}/documentation/versions/{version_id}", response_model=DocumentationVersionResponse)
def get_documentation_version(project_id: int, version_id: int, request: Request, db: Session = Depends(get_db)):
    _get_owned_project(db, request, project_id)
    version = DocumentationService(db).get_version(project_id, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Documentation version not found.")
    return version


@router.put("/{project_id}/documentation/versions/{version_id}", response_model=DocumentationVersionResponse)
def update_documentation_version(
    project_id: int,
    version_id: int,
    payload: DocumentationContentUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    _get_owned_project(db, request, project_id)
    service = DocumentationService(db)
    version = service.get_version(project_id, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Documentation version not found.")
    try:
        return service.save_edit(version, payload.content)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post(
    "/{project_id}/documentation/versions/{version_id}/commit",
    response_model=DocumentationCommitResponse,
)
async def commit_documentation_version(
    project_id: int,
    version_id: int,
    payload: DocumentationCommitRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    project = _get_owned_project(db, request, project_id)
    service = DocumentationService(db)
    version = service.get_version(project_id, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Documentation version not found.")
    if not version.content:
        raise HTTPException(status_code=400, detail="Documentation content is empty.")

    repository = (
        db.query(GitHubRepository)
        .filter(GitHubRepository.id == project.repository_id)
        .first()
    )
    if not repository or not repository.full_name or "/" not in repository.full_name:
        raise HTTPException(status_code=400, detail="Invalid GitHub repository information.")

    owner, repository_name = repository.full_name.split("/", 1)
    if not repository.installation or not repository.installation.installation_id:
        raise HTTPException(status_code=400, detail="GitHub App installation not available.")

    try:
        access_token = await generate_installation_token(repository.installation.installation_id)
        commit_service = GitHubCommitService()
        target_branch = payload.branch or repository.default_branch or "main"
        result = commit_service.commit_file(
            owner=owner,
            repository=repository_name,
            access_token=access_token,
            file_path=payload.file_path,
            content=version.content,
            commit_message=payload.commit_message,
            branch=target_branch,
        )

        # Update ProjectDocumentation to record our commit and prevent false-positive stale alerts
        doc = (
            db.query(ProjectDocumentation)
            .filter(
                ProjectDocumentation.project_id == project.id,
                ProjectDocumentation.id == version.documentation_id,
            )
            .first()
        )
        if doc:
            doc.committed_commit_sha = result["commit_sha"]
            doc.committed_at = datetime.now(timezone.utc)
            doc.source_commit_sha = result["commit_sha"]
            doc.status = "active"
            db.commit()

        return DocumentationCommitResponse(
            commit_sha=result["commit_sha"],
            html_url=result["html_url"],
            file_path=result["file_path"],
            branch=target_branch,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to commit to GitHub: {exc}") from exc


@catalog_router.get("/catalog", response_model=DocumentationCatalogResponse)
def get_documentation_catalog(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(db, request)
    return {"documents": DocumentationService(db).catalog_for_user(current_user.id)}


@catalog_router.get("/{documentation_id}/versions/{version_id}", response_model=DocumentationVersionResponse)
def get_catalog_document_version(
    documentation_id: int,
    version_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(db, request)
    version = DocumentationService(db).get_owned_document_version(
        current_user.id,
        documentation_id,
        version_id,
    )
    if not version:
        raise HTTPException(status_code=404, detail="Documentation version not found.")
    return version
