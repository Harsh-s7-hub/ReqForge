from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.supabase_db.base import Base


class Documentation(Base):
    """
    Represents an AI-generated project documentation version.

    A documentation record belongs to exactly one project analysis,
    which means every documentation version is tied to a specific
    repository commit.

    Documentation numbering is user-facing and starts from 0:

        Documentation #0
        Documentation #1
        Documentation #2
        ...

    The database primary key remains independent from this number.
    """

    __tablename__ = "documentation"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey(
            "projects.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    analysis_id: Mapped[int] = mapped_column(
        ForeignKey(
            "project_analysis.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    parent_documentation_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "documentation.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    documentation_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    commit_sha: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # ----------------------------------------------------------
    # AI generation
    # ----------------------------------------------------------

    generated_content: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ----------------------------------------------------------
    # Current editable document
    #
    # This is the content currently visible in the editor.
    #
    # Initially:
    #
    #     content == generated_content
    #
    # After human editing:
    #
    #     content != generated_content
    #
    # This allows us to preserve exactly what the AI produced
    # while also preserving the user's modifications.
    # ----------------------------------------------------------

    content: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ----------------------------------------------------------
    # Lifecycle
    #
    # generating
    # ready
    # rejected
    # committed
    # failed
    # ----------------------------------------------------------

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="generating",
        server_default="generating",
        index=True,
    )

    generation_attempt: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    # ----------------------------------------------------------
    # Human review
    # ----------------------------------------------------------

    rejection_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ----------------------------------------------------------
    # GitHub commit information
    # ----------------------------------------------------------

    commit_message: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    github_commit_sha: Mapped[str | None] = mapped_column(
        String(40),
        nullable=True,
        index=True,
    )

    committed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ----------------------------------------------------------
    # Timestamps
    # ----------------------------------------------------------

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

    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "documentation_number",
            name="uq_documentation_project_number",
        ),
        UniqueConstraint(
            "project_id",
            "analysis_id",
            name="uq_documentation_project_analysis",
        ),
        Index(
            "ix_documentation_project_created",
            "project_id",
            "created_at",
        ),
        Index(
            "ix_documentation_project_commit",
            "project_id",
            "commit_sha",
        ),
    )