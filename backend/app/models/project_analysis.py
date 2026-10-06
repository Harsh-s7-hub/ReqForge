from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.supabase_db.base import Base


class ProjectAnalysis(Base):
    __tablename__ = "project_analysis"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    # RegForge project this analysis belongs to
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Git commit represented by this analysis
    commit_sha: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        index=True,
    )

    # Previous analysis in this project's analysis history
    parent_analysis_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "project_analysis.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    # Sequential analysis number within the project
    analysis_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Analysis lifecycle state
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
        server_default="pending",
        index=True,
    )

    # Repository analysis statistics
    files_scanned: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    files_parsed: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    files_failed: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    unsupported_files: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    parse_errors: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

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


Index(
    "ix_project_analysis_project_number",
    ProjectAnalysis.project_id,
    ProjectAnalysis.analysis_number,
)

Index(
    "ix_project_analysis_project_commit",
    ProjectAnalysis.project_id,
    ProjectAnalysis.commit_sha,
)