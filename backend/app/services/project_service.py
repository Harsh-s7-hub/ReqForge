
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.github_repositories import GitHubRepository
from app.models.github_installation import GitHubInstallation


def create_project(
    db: Session,
    user_id: int,
    name: str,
    repository_id: int,
    description: str | None = None,
):
    # Verify that the repository belongs to an active
    # installation owned by the authenticated user.
    repository = (
        db.query(GitHubRepository)
        .join(
            GitHubInstallation,
            GitHubRepository.github_installation_id
            == GitHubInstallation.id,
        )
        .filter(
            GitHubRepository.id == repository_id,
            GitHubRepository.is_active.is_(True),
            GitHubInstallation.user_id == user_id,
            GitHubInstallation.is_active.is_(True),
        )
        .first()
    )

    if not repository:
        return None

    project = Project(
        user_id=user_id,
        repository_id=repository.id,
        name=name,
        description=description,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project, repository


def get_user_projects(
    db: Session,
    user_id: int,
):
    return (
        db.query(Project, GitHubRepository)
        .join(
            GitHubRepository,
            Project.repository_id == GitHubRepository.id,
        )
        .filter(Project.user_id == user_id)
        .order_by(Project.created_at.desc())
        .all()
    )
