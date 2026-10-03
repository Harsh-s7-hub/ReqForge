from datetime import datetime , timezone
from sqlalchemy import BigInteger,String,DateTime
from sqlalchemy.orm import Mapped,mapped_column,relationship
from app.supabase_db.base import Base

class User(Base):
    __tablename__ = "users"
    id:Mapped[int] = mapped_column(
        primary_key = True,
        autoincrement = True
    )

    github_id:Mapped[int] = mapped_column(
        BigInteger,
        unique=True,
        nullable=False,
        index=True
    )

    github_username:Mapped[str]= mapped_column(
        String(255),
        nullable=False
    )

    name:Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    avatar_url:Mapped[str | None] = mapped_column(
        String(2048),
        nullable = True
    )

    profile_url:Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True
    )

    created_at:Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    github_installations = relationship(
    "GitHubInstallation",
    back_populates="user",
    cascade="all, delete-orphan",
    )