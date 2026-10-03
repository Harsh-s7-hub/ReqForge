
from sqlalchemy.orm import Session

from app.models.github_installation import GitHubInstallation
from app.models.github_repositories import GitHubRepository


def get_user_repositories(
    db: Session,
    user_id: int,
) -> list[GitHubRepository]:

    repositories = (
        db.query(GitHubRepository)
        .join(
            GitHubInstallation,
            GitHubRepository.github_installation_id
            == GitHubInstallation.id,
        )
        .filter(
            GitHubInstallation.user_id == user_id,
            GitHubInstallation.is_active.is_(True),
            GitHubRepository.is_active.is_(True),
        )
        .order_by(GitHubRepository.full_name.asc())
        .all()
    )

    return repositories
