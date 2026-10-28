from __future__ import annotations

import logging
from sqlalchemy.orm import Session

from app.models.documentation_version import DocumentationVersion
from app.models.github_repositories import GitHubRepository
from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis
from app.models.project_documentation import ProjectDocumentation

logger = logging.getLogger(__name__)


class DocumentationStaleService:
    """Detects and updates stale status for project documentation when commits occur."""

    DOCUMENT_TYPE = "repository"

    @classmethod
    def mark_stale_from_push(
        cls,
        db: Session,
        github_repo_id: int,
        head_commit_sha: str,
        commit_message: str | None = None,
        committer_name: str | None = None,
    ) -> int:
        """
        Mark project documentation as stale when new commits are pushed to the repository.
        Ignores commits authored or pushed by RegForge to prevent self-stale false alarms.
        """
        if not head_commit_sha or not github_repo_id:
            return 0

        # Ignore if commit message or committer indicates it was created by RegForge
        if commit_message and "via regforge" in commit_message.lower():
            logger.info("Ignoring push commit %s because it was created via RegForge", head_commit_sha[:7])
            return 0

        if committer_name and "regforge" in committer_name.lower():
            logger.info("Ignoring push commit %s from committer %s", head_commit_sha[:7], committer_name)
            return 0

        repo = (
            db.query(GitHubRepository)
            .filter(
                GitHubRepository.github_repo_id == github_repo_id,
                GitHubRepository.is_active.is_(True),
            )
            .first()
        )
        if not repo:
            return 0

        projects = (
            db.query(Project)
            .filter(Project.repository_id == repo.id)
            .all()
        )
        if not projects:
            return 0

        marked_count = 0
        for project in projects:
            doc = (
                db.query(ProjectDocumentation)
                .filter(
                    ProjectDocumentation.project_id == project.id,
                    ProjectDocumentation.document_type == cls.DOCUMENT_TYPE,
                )
                .first()
            )
            if not doc:
                continue

            # If this push commit matches the commit that RegForge just made, it is NOT stale!
            if doc.committed_commit_sha and (
                doc.committed_commit_sha == head_commit_sha
                or doc.committed_commit_sha.startswith(head_commit_sha)
                or head_commit_sha.startswith(doc.committed_commit_sha)
            ):
                logger.info(
                    "Push commit %s matches RegForge committed_commit_sha for project #%s. Skipping stale mark.",
                    head_commit_sha[:7],
                    project.id,
                )
                continue

            # If the document source matches the new commit, it's also not stale
            if doc.source_commit_sha == head_commit_sha:
                continue

            if doc.status != "stale":
                doc.status = "stale"
                marked_count += 1
                logger.info(
                    "Marked documentation #%s for project #%s as STALE (doc commit: %s vs new commit: %s)",
                    doc.id,
                    project.id,
                    doc.source_commit_sha[:7] if doc.source_commit_sha else "none",
                    head_commit_sha[:7],
                )

        if marked_count > 0:
            db.commit()

        return marked_count

    @classmethod
    def get_status(cls, db: Session, project_id: int) -> dict:
        """
        Evaluate if a project's documentation is up-to-date or stale.
        Compares the latest documentation version commit against the latest analysis commit.
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {
                "has_documentation": False,
                "documentation_id": None,
                "latest_version_id": None,
                "version_number": None,
                "status": "none",
                "is_stale": False,
                "source_commit_sha": None,
                "current_commit_sha": None,
            }

        doc = (
            db.query(ProjectDocumentation)
            .filter(
                ProjectDocumentation.project_id == project_id,
                ProjectDocumentation.document_type == cls.DOCUMENT_TYPE,
            )
            .first()
        )

        if not doc:
            return {
                "has_documentation": False,
                "documentation_id": None,
                "latest_version_id": None,
                "version_number": None,
                "status": "none",
                "is_stale": False,
                "source_commit_sha": None,
                "current_commit_sha": None,
            }

        latest_version = (
            db.query(DocumentationVersion)
            .filter(DocumentationVersion.documentation_id == doc.id)
            .order_by(DocumentationVersion.version_number.desc())
            .first()
        )

        # Check latest analysis on the project
        latest_analysis = None
        if project.current_analysis_id:
            latest_analysis = (
                db.query(ProjectAnalysis)
                .filter(ProjectAnalysis.id == project.current_analysis_id)
                .first()
            )

        current_commit_sha = (
            latest_analysis.commit_sha if latest_analysis else None
        )
        source_commit_sha = (
            latest_version.source_commit_sha if latest_version else doc.source_commit_sha
        )

        # In-progress generation overrides stale flag
        if latest_version and latest_version.status in ("queued", "generating"):
            return {
                "has_documentation": True,
                "documentation_id": doc.id,
                "latest_version_id": latest_version.id,
                "version_number": latest_version.version_number,
                "status": latest_version.status,
                "is_stale": False,
                "source_commit_sha": source_commit_sha,
                "current_commit_sha": current_commit_sha,
            }

        # Stale if explicitly marked or if latest analyzed commit differs from doc commit
        is_stale = False
        if doc.status == "stale":
            # Verify it's not actually our own committed commit
            if doc.committed_commit_sha and current_commit_sha and (
                doc.committed_commit_sha == current_commit_sha
                or doc.committed_commit_sha.startswith(current_commit_sha)
                or current_commit_sha.startswith(doc.committed_commit_sha)
            ):
                is_stale = False
                doc.status = "active"
                db.commit()
            else:
                is_stale = True
        elif (
            current_commit_sha
            and source_commit_sha
            and current_commit_sha != source_commit_sha
        ):
            # If current_commit_sha matches the commit created by RegForge, it is NOT stale!
            if doc.committed_commit_sha and (
                doc.committed_commit_sha == current_commit_sha
                or doc.committed_commit_sha.startswith(current_commit_sha)
                or current_commit_sha.startswith(doc.committed_commit_sha)
            ):
                is_stale = False
            else:
                is_stale = True
                if doc.status != "stale":
                    doc.status = "stale"
                    db.commit()

        status_label = "stale" if is_stale else "active"


        return {
            "has_documentation": True,
            "documentation_id": doc.id,
            "latest_version_id": latest_version.id if latest_version else None,
            "version_number": latest_version.version_number if latest_version else 1,
            "status": status_label,
            "is_stale": is_stale,
            "source_commit_sha": source_commit_sha,
            "current_commit_sha": current_commit_sha,
        }
