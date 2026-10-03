from datetime import datetime
from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.supabase_db.base import Base


class GitHubInstallation(Base):
    __tablename__ = "github_installations"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    installation_id: Mapped[int] = mapped_column(
        BigInteger,
        unique=True,
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    account_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    account_login: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    account_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
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

    user = relationship("User", back_populates="github_installations")
    
    repositories = relationship(
        "GitHubRepository",
        back_populates="installation",
        cascade="all, delete-orphan",
    )
