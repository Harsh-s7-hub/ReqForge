import time
from pathlib import Path

import httpx
import jwt

from app.core.config import settings


GITHUB_API_URL = "https://api.github.com"


def load_private_key() -> str:
    key_path = Path(settings.GITHUB_APP_PRIVATE_KEY_PATH)

    if not key_path.is_absolute():
        key_path = Path.cwd() / key_path

    if not key_path.exists():
        raise FileNotFoundError(
            f"GitHub App private key not found: {key_path}"
        )

    return key_path.read_text(encoding="utf-8")


def generate_app_jwt() -> str:
    app_id = settings.GITHUB_APP_ID

    if not app_id:
        raise ValueError(
            "GitHub App ID is not configured"
        )

    now = int(time.time())

    payload = {
        "iat": now - 60,
        "exp": now + 600,
        "iss": str(app_id),
    }

    return jwt.encode(
        payload,
        load_private_key(),
        algorithm="RS256",
    )


def get_installation_url() -> str:
    """
    Generate the GitHub App installation URL
    using the slug configured in the backend.
    """
    app_slug = settings.GITHUB_APP_SLUG.strip()

    if not app_slug:
        raise ValueError(
            "GitHub App slug is not configured"
        )

    return (
        f"https://github.com/apps/"
        f"{app_slug}/installations/new"
    )


async def generate_installation_token(
    installation_id: int,
) -> str:
    """
    Generate an installation access token
    for a specific GitHub App installation.
    """

    if installation_id <= 0:
        raise ValueError(
            "Invalid GitHub installation ID"
        )

    app_jwt = generate_app_jwt()

    url = (
        f"{GITHUB_API_URL}/app/installations/"
        f"{installation_id}/access_tokens"
    )

    headers = {
        "Authorization": f"Bearer {app_jwt}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient(
        timeout=20.0
    ) as client:
        response = await client.post(
            url,
            headers=headers,
        )

        response.raise_for_status()

        data = response.json()

        token = data.get("token")

        if not token:
            raise RuntimeError(
                "GitHub did not return an installation access token."
            )

        return token