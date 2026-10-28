from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth.github_app import generate_installation_token
from app.documentation.services.documentation_service import DocumentationService
from app.documentation.services.documentation_stale_service import DocumentationStaleService
from app.models.github_repositories import GitHubRepository
from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis
from app.services.github_commit_service import GitHubCommitService
from app.services.project_analysis_service import ProjectAnalysisService
from app.services.project_token_service import ProjectTokenService
from app.supabase_db.session import get_db
from app.workers.documentation.dispatch import dispatch_generation_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/actions", tags=["GitHub Actions"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ActionDocCheckRequest(BaseModel):
    commit_sha: str = Field(..., description="The HEAD commit SHA of the PR or push")
    pr_number: int | None = Field(default=None, description="Optional GitHub pull request number")
    base_ref: str = Field(default="main", description="Target base branch")
    head_ref: str | None = Field(default=None, description="Source head branch")
    changed_files: list[str] = Field(default_factory=list, description="List of file paths changed in this commit/PR")


class ActionDocCheckResponse(BaseModel):
    project_id: int
    project_name: str
    repository_name: str
    is_stale: bool
    status: str
    latest_version_number: int
    action_required: bool
    code_files_changed: int
    summary_markdown: str


class ActionDocSyncRequest(BaseModel):
    commit_sha: str = Field(..., description="Commit SHA to synchronize documentation against")
    branch: str = Field(default="main", description="Target branch")


class ActionDocSyncResponse(BaseModel):
    project_id: int
    documentation_id: int
    version_id: int
    version_number: int
    job_id: int
    status: str
    message: str


# ---------------------------------------------------------------------------
# Authentication Dependency
# ---------------------------------------------------------------------------

def get_action_authenticated_project(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    x_regforge_token: Annotated[str | None, Header(alias="X-RegForge-Token")] = None,
    db: Session = Depends(get_db),
) -> Project:
    """
    Authenticate a GitHub Actions runner using a cryptographic project token.
    Accepts 'Authorization: Bearer <token>' or 'X-RegForge-Token: <token>'.
    """
    token: str | None = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        elif len(parts) == 1:
            token = parts[0]
    elif x_regforge_token:
        token = x_regforge_token

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing RegForge project token. Provide 'Authorization: Bearer <token>' or 'X-RegForge-Token'.",
        )

    project = ProjectTokenService.verify_token(db, token)
    if not project:
        raise HTTPException(
            status_code=401,
            detail="Invalid or unauthorized RegForge project token.",
        )

    return project


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/documentation/check", response_model=ActionDocCheckResponse)
def check_documentation_status(
    payload: ActionDocCheckRequest,
    project: Project = Depends(get_action_authenticated_project),
    db: Session = Depends(get_db),
):
    """
    Called by GitHub Actions on PR or push to evaluate whether documentation
    is stale or affected by incoming code changes.
    """
    repo = (
        db.query(GitHubRepository)
        .filter(GitHubRepository.id == project.repository_id)
        .first()
    )
    repo_name = repo.full_name if repo else project.name

    doc_status = DocumentationStaleService.get_status(db, project.id)

    # Inspect code extensions
    code_extensions = {
        ".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".java", ".rs",
        ".cpp", ".c", ".h", ".cs", ".php", ".rb", ".sql", ".prisma",
        ".proto", ".graphql", ".yml", ".yaml", ".json"
    }
    code_files = [
        f for f in payload.changed_files
        if any(f.endswith(ext) for ext in code_extensions)
        and not f.endswith("README.md")
    ]

    is_stale = doc_status["is_stale"] or (len(code_files) > 0 and doc_status["has_documentation"])
    action_required = is_stale

    # Build GitHub Markdown summary
    status_emoji = "⚠️" if is_stale else "✅"
    status_text = "Stale (Update Recommended)" if is_stale else "Up to date"

    summary_lines = [
        f"### {status_emoji} RegForge Architecture & Documentation Report",
        f"- **Project:** `{project.name}` ({repo_name})",
        f"- **Status:** **{status_text}**",
        f"- **Target Documentation:** `README.md`",
        f"- **Active Doc Version:** `v{doc_status['version_number'] or 1}`",
        f"- **Code Files Changed:** `{len(code_files)}` file(s)",
    ]

    if code_files:
        summary_lines.append("")
        summary_lines.append("<details><summary>Changed Code Files</summary>")
        summary_lines.append("")
        for f in code_files[:15]:
            summary_lines.append(f"- `{f}`")
        if len(code_files) > 15:
            summary_lines.append(f"- *...and {len(code_files) - 15} more files*")
        summary_lines.append("</details>")

    summary_lines.append("")
    if is_stale:
        summary_lines.append(
            f"> 💡 **Action Item:** Incoming code modifies project architecture. "
            f"When merged into `{payload.base_ref}`, RegForge will automatically synchronize `README.md`."
        )
    else:
        summary_lines.append("> ✨ Documentation matches current codebase architecture.")

    summary_markdown = "\n".join(summary_lines)

    return ActionDocCheckResponse(
        project_id=project.id,
        project_name=project.name,
        repository_name=repo_name,
        is_stale=is_stale,
        status="stale" if is_stale else "active",
        latest_version_number=doc_status["version_number"] or 1,
        action_required=action_required,
        code_files_changed=len(code_files),
        summary_markdown=summary_markdown,
    )


@router.post("/documentation/sync", response_model=ActionDocSyncResponse)
async def sync_documentation(
    payload: ActionDocSyncRequest,
    project: Project = Depends(get_action_authenticated_project),
    db: Session = Depends(get_db),
):
    """
    Called by GitHub Actions on push or PR merge to automatically queue
    documentation generation for the new commit.
    """
    repo = (
        db.query(GitHubRepository)
        .filter(GitHubRepository.id == project.repository_id)
        .first()
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")

    # Find existing analysis for commit or use latest analysis
    analysis = (
        db.query(ProjectAnalysis)
        .filter(
            ProjectAnalysis.project_id == project.id,
            ProjectAnalysis.commit_sha == payload.commit_sha,
            ProjectAnalysis.status == "completed",
        )
        .first()
    )

    if not analysis and project.current_analysis_id:
        analysis = (
            db.query(ProjectAnalysis)
            .filter(ProjectAnalysis.id == project.current_analysis_id)
            .first()
        )

    # If still no analysis, run project analysis for the commit
    if not analysis:
        if not repo.installation or not repo.installation.installation_id:
            raise HTTPException(status_code=400, detail="GitHub App installation not available.")

        token = await generate_installation_token(repo.installation.installation_id)
        analysis_service = ProjectAnalysisService(db)
        try:
            analysis = analysis_service.analyze_project(
                project=project,
                repository=repo,
                commit_sha=payload.commit_sha,
                github_token=token,
            )
        except Exception as exc:
            logger.exception("On-demand analysis creation failed for commit %s", payload.commit_sha)
            raise HTTPException(status_code=500, detail=f"Failed to analyze repository commit: {exc}") from exc

    doc_service = DocumentationService(db)
    try:
        documentation, version, job = doc_service.queue_generation(
            project=project,
            analysis=analysis,
        )
        dispatch_generation_job(db, job)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail="Documentation queue unavailable.") from exc

    return ActionDocSyncResponse(
        project_id=project.id,
        documentation_id=documentation.id,
        version_id=version.id,
        version_number=version.version_number,
        job_id=job.id,
        status="queued",
        message=f"Queued documentation generation v{version.version_number} for commit {payload.commit_sha[:7]}.",
    )
