from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.supabase_db.base import Base


class DocumentationGenerationJob(Base):
    """Durable execution state for one documentation-generation request."""

    __tablename__ = "documentation_generation_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    documentation_version_id: Mapped[int] = mapped_column(
        ForeignKey("documentation_versions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Celery will receive this ID through apply_async(task_id=...).
    celery_task_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
        index=True,
    )

    # queued | running | succeeded | failed | cancelled
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="queued",
        server_default="queued",
        index=True,
    )

    attempt_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    max_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
        server_default="3",
    )

    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
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
    "ix_documentation_generation_jobs_status_created",
    DocumentationGenerationJob.status,
    DocumentationGenerationJob.created_at,
)
