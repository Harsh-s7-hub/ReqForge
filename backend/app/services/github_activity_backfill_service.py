from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from app.auth.github_app import generate_installation_token
from app.models.github_installation import GitHubInstallation
from app.models.github_repositories import GitHubRepository


GITHUB_API_URL = "https://api.github.com"
GITHUB_API_VERSION = "2022-11-28"


async def backfill_repository_activity(
    db: Session,
    repository: GitHubRepository,
) -> datetime | None:
    """
    Find the latest commit in a repository and use its timestamp
    to initialize last_github_activity_at.

    This is intended only for one-time historical backfilling.
    Future activity is tracked through GitHub push webhooks.
    """

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.id
            == repository.github_installation_id,
            GitHubInstallation.is_active.is_(True),
        )
        .first()
    )

    if not installation:
        return None

    token_data = await generate_installation_token(
        installation.installation_id
    )

    access_token = token_data.get("token")

    if not access_token:
        raise ValueError(
            "GitHub did not return an installation access token."
        )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    }

    url = (
        f"{GITHUB_API_URL}/repos/"
        f"{repository.owner_login}/{repository.name}/commits"
    )

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            url,
            headers=headers,
            params={
                "per_page": 1,
            },
        )

        response.raise_for_status()

        commits = response.json()

    if not commits:
        return None

    latest_commit = commits[0]

    commit_data = latest_commit.get("commit") or {}
    author_data = commit_data.get("author") or {}

    timestamp = author_data.get("date")

    if not timestamp:
        return None

    activity_time = datetime.fromisoformat(
        timestamp.replace("Z", "+00:00")
    )

    if activity_time.tzinfo is None:
        activity_time = activity_time.replace(
            tzinfo=timezone.utc
        )

    repository.last_github_activity_at = activity_time

    db.commit()
    db.refresh(repository)

    return activity_time