
import logging

import httpx
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.github_installation import GitHubInstallation
from app.auth.github_app import generate_installation_token
from app.services.github_repositories_service import (
    sync_github_repositories,
)

logger = logging.getLogger(__name__)

GITHUB_API_URL = "https://api.github.com"
GITHUB_API_VERSION = "2022-11-28"
REPOSITORIES_PER_PAGE = 100


async def fetch_installation_repositories(
    installation_id: int,
) -> list[dict]:
    """
    Fetch all repositories accessible to a GitHub App installation.
    Handles GitHub API pagination.
    """

    token_data = await generate_installation_token(installation_id)
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

    repositories = []
    page = 1

    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            response = await client.get(
                f"{GITHUB_API_URL}/installation/repositories",
                headers=headers,
                params={
                    "per_page": REPOSITORIES_PER_PAGE,
                    "page": page,
                },
            )

            response.raise_for_status()

            data = response.json()
            page_repositories = data.get("repositories", [])

            if not isinstance(page_repositories, list):
                raise ValueError(
                    "Invalid repository response from GitHub."
                )

            repositories.extend(page_repositories)

            if len(page_repositories) < REPOSITORIES_PER_PAGE:
                break

            page += 1

    return repositories


async def handle_installation_event(
    db: Session,
    payload: dict,
) -> str:
    action = payload.get("action")
    installation_data = payload.get("installation", {})
    account = installation_data.get("account") or {}
    sender = payload.get("sender") or {}

    installation_id = installation_data.get("id")
    account_id = account.get("id")
    account_login = account.get("login")
    account_type = account.get("type")
    sender_id = sender.get("id")

    if not all([
        installation_id,
        account_id,
        account_login,
        account_type,
    ]):
        raise ValueError("Incomplete installation payload.")

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.installation_id == installation_id
        )
        .first()
    )

    if action == "created":
        if not sender_id:
            raise ValueError("Missing GitHub sender.")

        user = (
            db.query(User)
            .filter(User.github_id == sender_id)
            .first()
        )

        if not user:
            return "Installer is not registered in RegForge."

        # Never transfer an installation to another user.
        if installation and installation.user_id != user.id:
            return "This installation is already linked to another user."

        existing_user_installation = (
            db.query(GitHubInstallation)
            .filter(GitHubInstallation.user_id == user.id)
            .first()
        )

        if (
            existing_user_installation
            and existing_user_installation.installation_id
            != installation_id
            and existing_user_installation.is_active
        ):
            return (
                "User already has an active GitHub installation. "
                "Uninstall it before installing another."
            )

        if existing_user_installation:
            existing_user_installation.installation_id = installation_id
            existing_user_installation.account_id = account_id
            existing_user_installation.account_login = account_login
            existing_user_installation.account_type = account_type
            existing_user_installation.is_active = True

        elif installation:
            installation.account_id = account_id
            installation.account_login = account_login
            installation.account_type = account_type
            installation.is_active = True

        else:
            installation = GitHubInstallation(
                installation_id=installation_id,
                user_id=user.id,
                account_id=account_id,
                account_login=account_login,
                account_type=account_type,
                is_active=True,
            )
            db.add(installation)

        # Persist installation before requesting repository synchronization.
        db.commit()

        try:
            repositories = await fetch_installation_repositories(
                installation_id
            )

            if repositories:
                sync_message = sync_github_repositories(
                    db,
                    {
                        "action": "added",
                        "installation": {
                            "id": installation_id,
                        },
                        "repositories_added": repositories,
                    },
                )
            else:
                sync_message = "No repositories are accessible to this installation."

            logger.info(
                "GitHub installation %s synchronized: %s repositories",
                installation_id,
                len(repositories),
            )

            return (
                "GitHub installation registered successfully. "
                f"{sync_message}"
            )

        except Exception:
            db.rollback()

            logger.exception(
                "Repository synchronization failed for installation %s",
                installation_id,
            )

            raise

    if not installation:
        return "Installation record not found."

    if action in ("deleted", "suspend"):
        installation.is_active = False

    elif action in ("unsuspend", "new_permissions_accepted"):
        installation.is_active = True

    else:
        return f"Installation action ignored: {action}"

    db.commit()

    return f"Installation updated: {action}"
