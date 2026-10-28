from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.supabase_db.base import Base


class AIModelConfiguration(Base):
    """
    Stores persistent AI inference model configurations, system prompt directives,
    and generation hyperparameters in Supabase PostgreSQL.
    """

    __tablename__ = "ai_model_configurations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    active_model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="qwen2.5-coder:7b",
        server_default="qwen2.5-coder:7b",
    )

    temperature: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.20,
        server_default="0.20",
    )

    top_p: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.85,
        server_default="0.85",
    )

    max_output_tokens: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=4096,
        server_default="4096",
    )

    system_prompt: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )
