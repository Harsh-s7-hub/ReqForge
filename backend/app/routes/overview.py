from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.documentation_generation_job import DocumentationGenerationJob
from app.models.documentation_version import DocumentationVersion
from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis
from app.models.project_documentation import ProjectDocumentation
from app.services.service_session import get_current_user
from app.supabase_db.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/overview", tags=["Overview Telemetry"])


class AgentActivityItem(BaseModel):
    id: str
    name: str
    task: str
    status: str
    time: str


class OverviewTelemetryResponse(BaseModel):
    active_agents: int
    total_executions: int
    ai_models_configured: bool
    first_workflow_completed: bool
    recent_activities: list[AgentActivityItem]


def _format_relative_time(dt: datetime | None) -> str:
    if not dt:
        return "Recently"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    diff = now - dt

    seconds = int(diff.total_seconds())
    if seconds < 60:
        return "Just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"
    days = hours // 24
    if days == 1:
        return "Yesterday"
    if days < 30:
        return f"{days}d ago"
    return dt.strftime("%b %d")


@router.get("/telemetry", response_model=OverviewTelemetryResponse)
def get_overview_telemetry(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Returns real-time agent telemetry, execution counts, setup guide progress,
    and recent activity records for the authenticated user.
    """
    user = get_current_user(db, request)

    user_projects = db.query(Project).filter(Project.user_id == user.id).all()
    project_ids = [p.id for p in user_projects]
    project_map = {p.id: p.name for p in user_projects}

    if not project_ids:
        # Check Ollama status
        ai_configured = False
        try:
            with httpx.Client(timeout=2.0) as client:
                r = client.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags")
                if r.status_code == 200:
                    models = r.json().get("models", [])
                    ai_configured = len(models) > 0
        except Exception:
            ai_configured = False

        return OverviewTelemetryResponse(
            active_agents=0,
            total_executions=0,
            ai_models_configured=ai_configured,
            first_workflow_completed=False,
            recent_activities=[],
        )

    # 1. Query Project Analyses
    analyses = (
        db.query(ProjectAnalysis)
        .filter(ProjectAnalysis.project_id.in_(project_ids))
        .order_by(ProjectAnalysis.created_at.desc())
        .limit(20)
        .all()
    )
    total_analyses_count = (
        db.query(ProjectAnalysis)
        .filter(ProjectAnalysis.project_id.in_(project_ids))
        .count()
    )
    running_analyses_count = (
        db.query(ProjectAnalysis)
        .filter(
            ProjectAnalysis.project_id.in_(project_ids),
            ProjectAnalysis.status == "running",
        )
        .count()
    )

    # 2. Query Documentation Generation Jobs
    doc_jobs = (
        db.query(
            DocumentationGenerationJob,
            ProjectDocumentation.project_id,
            DocumentationVersion.version_number,
        )
        .join(
            DocumentationVersion,
            DocumentationGenerationJob.documentation_version_id == DocumentationVersion.id,
        )
        .join(
            ProjectDocumentation,
            DocumentationVersion.documentation_id == ProjectDocumentation.id,
        )
        .filter(ProjectDocumentation.project_id.in_(project_ids))
        .order_by(DocumentationGenerationJob.created_at.desc())
        .limit(20)
        .all()
    )
    total_doc_jobs_count = (
        db.query(DocumentationGenerationJob)
        .join(
            DocumentationVersion,
            DocumentationGenerationJob.documentation_version_id == DocumentationVersion.id,
        )
        .join(
            ProjectDocumentation,
            DocumentationVersion.documentation_id == ProjectDocumentation.id,
        )
        .filter(ProjectDocumentation.project_id.in_(project_ids))
        .count()
    )
    active_doc_jobs_count = (
        db.query(DocumentationGenerationJob)
        .join(
            DocumentationVersion,
            DocumentationGenerationJob.documentation_version_id == DocumentationVersion.id,
        )
        .join(
            ProjectDocumentation,
            DocumentationVersion.documentation_id == ProjectDocumentation.id,
        )
        .filter(
            ProjectDocumentation.project_id.in_(project_ids),
            DocumentationGenerationJob.status.in_(["queued", "running"]),
        )
        .count()
    )

    # 3. Combine into unified Activity items
    activities: list[dict[str, Any]] = []

    for a in analyses:
        status_clean = "completed" if a.status == "completed" else "failed" if a.status == "failed" else "running"
        proj_name = project_map.get(a.project_id, "Repository")
        commit_short = a.commit_sha[:7] if a.commit_sha else "latest"
        activities.append({
            "id": f"analysis-{a.id}",
            "created_at": a.created_at,
            "name": proj_name,
            "task": f"AST Code Graph Analysis ({commit_short})",
            "status": status_clean,
            "time": _format_relative_time(a.created_at),
        })

    for job, p_id, v_num in doc_jobs:
        status_clean = (
            "completed" if job.status == "succeeded"
            else "failed" if job.status == "failed"
            else "running" if job.status == "running"
            else "queued"
        )
        proj_name = project_map.get(p_id, "Documentation")
        activities.append({
            "id": f"docjob-{job.id}",
            "created_at": job.created_at,
            "name": proj_name,
            "task": f"AI Documentation Synthesis (v{v_num})",
            "status": status_clean,
            "time": _format_relative_time(job.created_at),
        })

    # Sort combined activity chronologically desc
    activities.sort(key=lambda x: x["created_at"], reverse=True)

    activity_items = [
        AgentActivityItem(
            id=item["id"],
            name=item["name"],
            task=item["task"],
            status=item["status"],
            time=item["time"],
        )
        for item in activities[:8]
    ]

    total_executions = total_analyses_count + total_doc_jobs_count
    active_agents = running_analyses_count + active_doc_jobs_count

    # 4. Check if AI Models are configured
    ai_configured = False
    try:
        with httpx.Client(timeout=2.0) as client:
            r = client.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags")
            if r.status_code == 200:
                models = r.json().get("models", [])
                ai_configured = len(models) > 0
    except Exception:
        ai_configured = False

    return OverviewTelemetryResponse(
        active_agents=active_agents,
        total_executions=total_executions,
        ai_models_configured=ai_configured,
        first_workflow_completed=total_executions > 0,
        recent_activities=activity_items,
    )
