
import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.github_installation_service import (
    handle_installation_event,
)
from app.services.github_repositories_service import (
    sync_github_repositories,
)
from app.supabase_db.session import get_db


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/webhooks",
    tags=["GitHub Webhooks"],
)


@router.post("/github")
async def github_webhook(
    request: Request,
    x_github_event: str = Header(alias="X-GitHub-Event"),
    x_hub_signature_256: str = Header(
        alias="X-Hub-Signature-256"
    ),
    db: Session = Depends(get_db),
):
    body = await request.body()

    expected_signature = "sha256=" + hmac.new(
        settings.GITHUB_WEBHOOK_SECRET.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        expected_signature,
        x_hub_signature_256,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid GitHub webhook signature.",
        )

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook JSON.",
        )

    try:
        if x_github_event == "installation":
            message = handle_installation_event(db, payload)

        elif x_github_event == "installation_repositories":
            message = sync_github_repositories(db, payload)

        else:
            return {
                "received": True,
                "message": f"Event received: {x_github_event}",
            }

        return {
            "received": True,
            "message": message,
        }

    except Exception:
        db.rollback()

        logger.exception(
            "Failed to process GitHub webhook event: %s",
            x_github_event,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process GitHub webhook event.",
        )
