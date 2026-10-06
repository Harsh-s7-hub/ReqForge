from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.github_installation import GitHubInstallation
from app.models.github_repositories import GitHubRepository
from app.models.user import User


def update_repository_activity_from_push(
    db: Session,
    payload: dict,
) -> bool:
    """
    Update repository activity when a GitHub push webhook is received.

    The GitHub App's installation identifies the RegForge installation,
    while the webhook sender identifies the GitHub user who performed
    the activity.

    The activity timestamp is the time the webhook was processed rather
    than the commit author's timestamp. This represents when the
    repository was actually used through a new push event.
    """

    installation_data = payload.get("installation") or {}
    repository_data = payload.get("repository") or {}
    sender = payload.get("sender") or {}

    installation_id = installation_data.get("id")
    github_repo_id = repository_data.get("id")
    sender_id = sender.get("id")

    if not installation_id:
        return False

    if not github_repo_id:
        return False

    if not sender_id:
        return False

    # Find the active RegForge GitHub installation.
    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.installation_id == installation_id,
            GitHubInstallation.is_active.is_(True),
        )
        .first()
    )

    if not installation:
        return False

    if installation.user_id is None:
        return False

    # Make sure the GitHub user who generated the event
    # is the same user who owns this RegForge installation.
    user = (
        db.query(User)
        .filter(User.id == installation.user_id)
        .first()
    )

    if not user:
        return False

    if user.github_id != sender_id:
        return False

    # Find the repository belonging to this installation.
    repository = (
        db.query(GitHubRepository)
        .filter(
            GitHubRepository.github_repo_id == github_repo_id,
            GitHubRepository.github_installation_id == installation.id,
            GitHubRepository.is_active.is_(True),
        )
        .first()
    )

    if not repository:
        return False

    # Use the webhook processing time as the activity time.
    #
    # This is intentionally NOT head_commit.timestamp because that
    # represents commit creation time, which may be much older than
    # the moment the user actually pushed/used the repository.
    activity_time = datetime.now(timezone.utc)

    # Only move the timestamp forward.
    if (
        repository.last_github_activity_at is None
        or activity_time > repository.last_github_activity_at
    ):
        repository.last_github_activity_at = activity_time

        db.commit()

    return True