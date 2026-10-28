from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path

from app.auth.github_app import generate_installation_token
from app.documentation.services.context_builder import DocumentationContextBuilder
from app.models.documentation_generation_job import DocumentationGenerationJob
from app.models.documentation_version import DocumentationVersion
from app.models.github_repositories import GitHubRepository
from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis
from app.models.project_documentation import ProjectDocumentation
from app.services.github_repository_snapshot_service import GitHubRepositorySnapshotService
from app.supabase_db.session import SessionLocal
from app.workers.celery_app import celery_app
from ai_services.ollama.client import OllamaClient
from ai_services.qdrant.revision_indexing_service import index_revision_snapshot
from app.core.config import settings
from app.services.model_config_service import model_config_service


# Dynamically loads the active system prompt directive from model_config_service.
# When saved or modified in the UI, tasks immediately use the updated directive.
def get_system_prompt() -> str:
    return model_config_service.get_hyperparameters().get("system_prompt", "")


SYSTEM_PROMPT = get_system_prompt()



@celery_app.task(bind=True, name="documentation.generate", max_retries=2)
def generate_documentation(self, job_id: int) -> None:
    db = SessionLocal()
    snapshot_service = GitHubRepositorySnapshotService()
    snapshot_root: Path | None = None
    try:
        job = db.query(DocumentationGenerationJob).filter_by(id=job_id).first()
        if not job or job.status == "succeeded":
            return
        version = db.query(DocumentationVersion).filter_by(id=job.documentation_version_id).first()
        if not version:
            raise RuntimeError("Documentation version is no longer available.")
        document = db.query(ProjectDocumentation).filter_by(id=version.documentation_id).first()
        analysis = db.query(ProjectAnalysis).filter_by(id=version.analysis_id).first()
        project = db.query(Project).filter_by(id=document.project_id).first()
        repository = db.query(GitHubRepository).filter_by(id=project.repository_id).first()
        if not all((document, analysis, project, repository)) or analysis.status != "completed" or not repository.is_active:
            raise RuntimeError("Documentation job source is no longer available.")

        job.status, job.attempt_count, job.started_at = "running", job.attempt_count + 1, datetime.now(timezone.utc)
        version.status = "generating"
        db.commit()

        token = asyncio.run(generate_installation_token(repository.installation.installation_id))
        owner, name = repository.full_name.split("/", 1)
        snapshot_root = snapshot_service.download_snapshot(owner, name, analysis.commit_sha, token)
        index_revision_snapshot(project_id=project.id, repository_id=repository.id, github_repository_id=repository.github_repo_id, analysis_id=analysis.id, commit_sha=analysis.commit_sha, snapshot_root=snapshot_root)
        context = DocumentationContextBuilder().build(project_id=project.id, repository_id=repository.id, analysis_id=analysis.id, commit_sha=analysis.commit_sha)

        active_params = model_config_service.get_hyperparameters()
        active_model = model_config_service.get_active_model()
        system_directive = active_params.get("system_prompt") or get_system_prompt()

        content = OllamaClient().generate(
            system=system_directive,
            prompt=f"Generate complete repository documentation for commit {analysis.commit_sha}.\n\n{context}",
            model=active_model,
            temperature=active_params.get("temperature", 0.20),
            top_p=active_params.get("top_p", 0.85),
            max_tokens=active_params.get("max_output_tokens", 4096),
        )

        version.ai_generated_content = content
        version.content = content
        version.status = "ready"
        version.model_name = active_model
        document.source_analysis_id, document.source_commit_sha, document.status = analysis.id, analysis.commit_sha, "active"
        document.last_generated_at = datetime.now(timezone.utc)
        job.status, job.completed_at = "succeeded", datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:
        db.rollback()
        job = db.query(DocumentationGenerationJob).filter_by(id=job_id).first()
        version = db.query(DocumentationVersion).filter_by(id=job.documentation_version_id).first() if job else None
        if job and job.attempt_count < job.max_attempts:
            job.status = "queued"
            job.error_code = type(exc).__name__
            job.error_message = "Generation attempt failed; retry scheduled."
            if version: version.status = "queued"
            db.commit()
            raise self.retry(exc=exc, countdown=30)
        if job:
            job.status, job.completed_at = "failed", datetime.now(timezone.utc)
            job.error_code, job.error_message = type(exc).__name__, "Documentation generation failed."
        if version:
            version.status, version.failure_reason = "failed", "Documentation generation failed."
        db.commit()
        raise
    finally:
        if snapshot_root:
            snapshot_service.cleanup_snapshot(snapshot_root.parent.parent)
        db.close()
