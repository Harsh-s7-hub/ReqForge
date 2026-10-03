
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


class GitHubRepository(Base):
    __tablename__ = "github_repositories"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    # GitHub's globally unique repository ID
    github_repo_id: Mapped[int] = mapped_column(
        BigInteger,
        unique=True,
        nullable=False,
        index=True,
    )

    # Internal ID of the GitHub installation in our database
    github_installation_id: Mapped[int] = mapped_column(
        ForeignKey("github_installations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )

    owner_login: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_private: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    html_url: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
    )

    default_branch: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
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

    installation = relationship(
        "GitHubInstallation",
        back_populates="repositories",
    )
    