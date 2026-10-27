from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.supabase_db.base import Base


class DocumentationVersion(Base):
    """An immutable AI generation with a separately editable document copy."""

    __tablename__ = "documentation_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    documentation_id: Mapped[int] = mapped_column(
        ForeignKey("project_documentations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    analysis_id: Mapped[int | None] = mapped_column(
        ForeignKey("project_analysis.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    version_number: Mapped[int] = mapped_column(Integer, nullable=False)

    source_commit_sha: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        index=True,
    )

    # Queued and failed versions intentionally have no editable content yet.
    content: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Never alter this after successful AI generation.
    ai_generated_content: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # queued | generating | ready | failed | cancelled
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="queued",
        server_default="queued",
        index=True,
    )

    # initial | regeneration
    generation_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="initial",
        server_default="initial",
    )

    model_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    generation_metadata: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    "ix_documentation_versions_document_version",
    DocumentationVersion.documentation_id,
    DocumentationVersion.version_number,
    unique=True,
)
