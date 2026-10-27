from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.supabase_db.base import Base


class ProjectDocumentation(Base):
    """The stable documentation record for one project and document type."""

    __tablename__ = "project_documentations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # v1 has one type: a complete repository document. The field keeps the
    # schema extensible for future architecture/API-specific documents.
    document_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="repository",
        server_default="repository",
    )

    documentation_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)

    # The newest source represented by this stable documentation record.
    source_analysis_id: Mapped[int | None] = mapped_column(
        ForeignKey("project_analysis.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    source_commit_sha: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        index=True,
    )

    # active | stale | archived
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="active",
        server_default="active",
        index=True,
    )

    last_generated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    committed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    committed_commit_sha: Mapped[str | None] = mapped_column(
        String(40),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


Index(
    "ix_project_documentations_project_type",
    ProjectDocumentation.project_id,
    ProjectDocumentation.document_type,
    unique=True,
)
