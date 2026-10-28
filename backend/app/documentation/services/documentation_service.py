from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.documentation_generation_job import DocumentationGenerationJob
from app.models.documentation_version import DocumentationVersion
from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis
from app.models.project_documentation import ProjectDocumentation
from app.models.github_repositories import GitHubRepository


class DocumentationService:
    """Creates documentation versions and performs project-scoped lookups."""

    DOCUMENT_TYPE = "repository"

    def __init__(self, db: Session):
        self.db = db

    def queue_generation(
        self,
        *,
        project: Project,
        analysis: ProjectAnalysis,
    ) -> tuple[ProjectDocumentation, DocumentationVersion, DocumentationGenerationJob]:
        self._ensure_no_active_generation(project.id, analysis.id)

        documentation = self._get_or_create_documentation(project, analysis)
        next_version_number = self._next_version_number(documentation.id)

        version = DocumentationVersion(
            documentation_id=documentation.id,
            analysis_id=analysis.id,
            version_number=next_version_number,
            source_commit_sha=analysis.commit_sha,
            status="queued",
            generation_type=("initial" if next_version_number == 1 else "regeneration"),
        )
        self.db.add(version)
        self.db.flush()

        job = DocumentationGenerationJob(
            documentation_version_id=version.id,
            status="queued",
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(documentation)
        self.db.refresh(version)
        self.db.refresh(job)
        return documentation, version, job

    def list_versions(self, project_id: int) -> list[DocumentationVersion]:
        return (
            self.db.query(DocumentationVersion)
            .join(ProjectDocumentation)
            .filter(
                ProjectDocumentation.project_id == project_id,
                ProjectDocumentation.document_type == self.DOCUMENT_TYPE,
            )
            .order_by(DocumentationVersion.version_number.desc())
            .all()
        )

    def get_version(self, project_id: int, version_id: int) -> DocumentationVersion | None:
        return (
            self.db.query(DocumentationVersion)
            .join(ProjectDocumentation)
            .filter(
                DocumentationVersion.id == version_id,
                ProjectDocumentation.project_id == project_id,
                ProjectDocumentation.document_type == self.DOCUMENT_TYPE,
            )
            .first()
        )

    def save_edit(self, version: DocumentationVersion, content: str) -> DocumentationVersion:
        if version.status != "ready":
            raise ValueError("Only ready documentation versions can be edited.")
        version.content = content
        self.db.commit()
        self.db.refresh(version)
        return version

    def catalog_for_user(self, user_id: int) -> list[dict]:
        documents = (
            self.db.query(ProjectDocumentation, Project, GitHubRepository)
            .join(Project, Project.id == ProjectDocumentation.project_id)
            .join(GitHubRepository, GitHubRepository.id == Project.repository_id)
            .filter(
                Project.user_id == user_id,
                ProjectDocumentation.document_type == self.DOCUMENT_TYPE,
            )
            .order_by(Project.name.asc())
            .all()
        )
        catalog = []
        for documentation, project, repository in documents:
            versions = (
                self.db.query(DocumentationVersion)
                .filter(DocumentationVersion.documentation_id == documentation.id)
                .order_by(DocumentationVersion.version_number.desc())
                .all()
            )
            catalog.append({
                "id": documentation.id,
                "project_id": project.id,
                "project_name": project.name,
                "repository_name": repository.full_name,
                "title": documentation.title,
                "status": documentation.status,
                "versions": [self._catalog_version(version) for version in versions],
            })
        return catalog

    def get_owned_document_version(self, user_id: int, documentation_id: int, version_id: int) -> DocumentationVersion | None:
        return (
            self.db.query(DocumentationVersion)
            .join(ProjectDocumentation)
            .join(Project, Project.id == ProjectDocumentation.project_id)
            .filter(
                Project.user_id == user_id,
                ProjectDocumentation.id == documentation_id,
                DocumentationVersion.id == version_id,
            )
            .first()
        )

    @staticmethod
    def _catalog_version(version: DocumentationVersion) -> dict:
        content = version.content or version.ai_generated_content or ""
        return {
            "id": version.id,
            "version_number": version.version_number,
            "source_commit_sha": version.source_commit_sha,
            "status": version.status,
            "created_at": version.created_at,
            "word_count": len(content.split()),
            "line_count": len(content.splitlines()),
        }

    def _ensure_no_active_generation(self, project_id: int, analysis_id: int) -> None:
        active = (
            self.db.query(DocumentationVersion.id)
            .join(ProjectDocumentation)
            .filter(
                ProjectDocumentation.project_id == project_id,
                DocumentationVersion.analysis_id == analysis_id,
                DocumentationVersion.status.in_(("queued", "generating")),
            )
            .first()
        )
        if active:
            raise ValueError("Documentation generation is already active for this analysis.")

    def _get_or_create_documentation(
        self,
        project: Project,
        analysis: ProjectAnalysis,
    ) -> ProjectDocumentation:
        documentation = (
            self.db.query(ProjectDocumentation)
            .filter(
                ProjectDocumentation.project_id == project.id,
                ProjectDocumentation.document_type == self.DOCUMENT_TYPE,
            )
            .first()
        )
        if documentation:
            return documentation

        highest_number = (
            self.db.query(func.max(ProjectDocumentation.documentation_number))
            .filter(ProjectDocumentation.project_id == project.id)
            .scalar()
        )
        documentation = ProjectDocumentation(
            project_id=project.id,
            document_type=self.DOCUMENT_TYPE,
            documentation_number=(highest_number or 0) + 1,
            title=f"{project.name} Repository Documentation",
            source_analysis_id=analysis.id,
            source_commit_sha=analysis.commit_sha,
            status="stale",
        )
        self.db.add(documentation)
        self.db.flush()
        return documentation

    def _next_version_number(self, documentation_id: int) -> int:
        highest_number = (
            self.db.query(func.max(DocumentationVersion.version_number))
            .filter(DocumentationVersion.documentation_id == documentation_id)
            .scalar()
        )
        return (highest_number or 0) + 1
