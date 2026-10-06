from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.supabase_db.base import Base


class AnalysisFile(Base):
    __tablename__ = "analysis_files"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    # Analysis this file belongs to
    analysis_id: Mapped[int] = mapped_column(
        ForeignKey(
            "project_analysis.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # Repository-relative path
    file_path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Detected programming language
    language: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    # Content hash used for change detection
    file_hash: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )

    # Number of source lines
    lines: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # File size in bytes
    bytes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # Parser result
    parse_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
        server_default="pending",
    )

    # Detailed parser error, if any
    parse_error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


Index(
    "ix_analysis_files_analysis_path",
    AnalysisFile.analysis_id,
    AnalysisFile.file_path,
)