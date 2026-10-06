from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.project import ProjectCreate
from app.services.project_service import (
    create_project,
    get_user_projects,
)
from app.services.service_session import get_current_user
from app.supabase_db.session import get_db


router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"],
)


@router.post("/", status_code=201)
def create_new_project(
    data: ProjectCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user: User = get_current_user(db, request)

    result = create_project(
        db=db,
        user_id=current_user.id,
        name=data.name,
        repository_id=data.repository_id,
        description=data.description,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Repository not found or access denied.",
        )

    project, repository = result

    return {
        "success": True,
        "message": "Project created successfully.",
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "repository_id": repository.id,
            "repository_name": repository.full_name,
            "repository_url": repository.html_url,
            "repository_access_active": repository.is_active,
            "current_analysis_id": project.current_analysis_id,
            "created_at": project.created_at,
        },
    }


@router.get("/")
def list_projects(
    request: Request,
    db: Session = Depends(get_db),
):
    current_user: User = get_current_user(db, request)

    results = get_user_projects(
        db=db,
        user_id=current_user.id,
    )

    return {
        "success": True,
        "count": len(results),
        "projects": [
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "repository_id": repository.id,
                "repository_name": repository.full_name,
                "repository_url": repository.html_url,
                "repository_access_active": repository.is_active,
                "current_analysis_id": project.current_analysis_id,
                "created_at": project.created_at,
            }
            for project, repository in results
        ],
    }