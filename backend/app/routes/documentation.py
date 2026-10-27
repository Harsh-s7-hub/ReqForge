from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.documentation.schemas.documentation import (
    DocumentationContentUpdate,
    DocumentationGenerationResponse,
    DocumentationVersionResponse,
)
from app.documentation.services.documentation_service import DocumentationService
from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis
from app.services.service_session import get_current_user
from app.supabase_db.session import get_db
from app.workers.documentation.dispatch import dispatch_generation_job


router = APIRouter(prefix="/api/projects", tags=["Documentation"])


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
