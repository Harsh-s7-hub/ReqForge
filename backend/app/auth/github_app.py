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
    if app_id in (None, ""):
        raise ValueError("GitHub App ID is not configured")

    now = int(time.time())

    payload = {
        "iat": now - 60,
        "exp": now + 600,
        "iss": str(app_id),
    }

    return jwt.encode(
        payload, 
        load_private_key(), 
        algorithm="RS256"
    )

async def generate_installation_token(
        installation_id:int
) -> dict:
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

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            url,
            headers=headers
        )

        response.raise_for_status()

        return response.json()