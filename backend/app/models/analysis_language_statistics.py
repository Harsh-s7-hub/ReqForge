from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.supabase_db.base import Base


class AnalysisLanguageStatistics(Base):
    __tablename__ = "analysis_language_statistics"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    # Analysis this language statistic belongs to
    analysis_id: Mapped[int] = mapped_column(
        ForeignKey(
            "project_analysis.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # Programming language
    language: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    # Number of files detected for this language
    files: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # Number of files successfully parsed
    parsed_files: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # Number of files with parser errors
    parse_errors: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # Total source lines
    lines: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # Total file size in bytes
    bytes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


UniqueConstraint(
    "analysis_id",
    "language",
    name="uq_analysis_language",
)

Index(
    "ix_analysis_language_analysis_language",
    AnalysisLanguageStatistics.analysis_id,
    AnalysisLanguageStatistics.language,
)