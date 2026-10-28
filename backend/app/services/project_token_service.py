from __future__ import annotations

import hashlib
import hmac
import logging
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.project import Project

logger = logging.getLogger(__name__)


class ProjectTokenService:
    """Generates and verifies cryptographic project API tokens for GitHub Actions."""

    TOKEN_PREFIX = "rf_proj"

    @classmethod
    def generate_token(cls, project: Project) -> str:
        """
        Generate a secure, deterministic HMAC token for a project.
        Format: rf_proj_<project_id>_<signature>
        """
        secret = settings.ENCRYPTION_KEY.encode("utf-8")
        payload = f"{project.id}:{project.user_id}:{project.repository_id}".encode("utf-8")
        signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()[:32]
        return f"{cls.TOKEN_PREFIX}_{project.id}_{signature}"

    @classmethod
    def verify_token(cls, db: Session, token: str) -> Project | None:
        """
        Verify a project token and return the associated Project instance,
        or None if invalid.
        """
        if not token:
            return None

        clean_token = token.strip()
        prefix = f"{cls.TOKEN_PREFIX}_"
        if not clean_token.startswith(prefix):
            return None

        remainder = clean_token[len(prefix):]
        parts = remainder.split("_", 1)
        if len(parts) != 2:
            return None

        project_id_str, provided_sig = parts
        if not project_id_str.isdigit():
            return None

        project_id = int(project_id_str)
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None

        expected_token = cls.generate_token(project)
        expected_sig = expected_token[len(prefix):].split("_", 1)[-1]

        if not hmac.compare_digest(provided_sig, expected_sig):
            logger.warning("Invalid project token signature attempt for project #%s", project_id)
            return None

        return project
