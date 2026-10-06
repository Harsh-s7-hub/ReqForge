from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.supabase_db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    # RegForge user who owns this project
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Internal database ID of the selected GitHub repository
    repository_id: Mapped[int] = mapped_column(
        ForeignKey("github_repositories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Latest/current analysis for this project.
    # Nullable because a project can exist before its first analysis.
    current_analysis_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "project_analysis.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
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
    "ix_projects_user_repository",
    Project.user_id,
    Project.repository_id,
)