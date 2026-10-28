import asyncio
import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request

from app.core.config import settings
from app.services.github_activity_service import (
    update_repository_activity_from_push,
)
from app.services.github_installation_service import (
    handle_installation_event,
)
from app.services.github_repositories_service import (
    sync_github_repositories,
)
from app.documentation.services.documentation_stale_service import (
    DocumentationStaleService,
)
from app.supabase_db.session import SessionLocal


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/webhooks",
    tags=["GitHub Webhooks"],
)


def process_installation_event(payload: dict):
    """Process installation events outside the webhook request."""

    db = SessionLocal()

    try:
        asyncio.run(
            handle_installation_event(db, payload)
        )

    except Exception:
        db.rollback()
        logger.exception("Installation event processing failed.")

    finally:
        db.close()


def process_repository_event(payload: dict):
    """Process repository access changes outside the webhook request."""

    db = SessionLocal()

    try:
        message = sync_github_repositories(db, payload)
        logger.info(message)

    except Exception:
        db.rollback()
        logger.exception("Repository event processing failed.")

    finally:
        db.close()


def process_push_event(payload: dict):
    """
    Process GitHub push activity outside the webhook request.

    This updates last_github_activity_at for the repository
    associated with the user's GitHub App installation.
    """

    db = SessionLocal()

    try:
        updated = update_repository_activity_from_push(
            db,
            payload,
        )

        if updated:
            repository = payload.get("repository") or {}
            full_name = repository.get("full_name", "unknown")

            logger.info(
                "GitHub activity updated for repository: %s",
                full_name,
            )
        else:
            logger.info(
                "GitHub push received but repository activity "
                "was not updated."
            )

        # Check and mark documentation as stale if commits changed (excluding RegForge's own commits)
        head_commit = payload.get("head_commit") or {}
        commit_message = head_commit.get("message")
        committer = head_commit.get("committer") or {}
        committer_name = committer.get("name")
        head_commit_sha = payload.get("after") or head_commit.get("id")
        repo_data = payload.get("repository") or {}
        github_repo_id = repo_data.get("id")

        if github_repo_id and head_commit_sha:
            stale_count = DocumentationStaleService.mark_stale_from_push(
                db,
                github_repo_id=github_repo_id,
                head_commit_sha=head_commit_sha,
                commit_message=commit_message,
                committer_name=committer_name,
            )
            if stale_count > 0:
                logger.info(
                    "Marked %d project document(s) as STALE for repo ID: %s",
                    stale_count,
                    github_repo_id,
                )

    except Exception:
        db.rollback()
        logger.exception("Push activity processing failed.")

    finally:
        db.close()


def process_pull_request_event(payload: dict):
    """
    Process GitHub pull request events outside the webhook request.
    Marks project documentation as stale when a PR is merged into main.
    """
    action = payload.get("action")
    pr = payload.get("pull_request") or {}
    is_merged = pr.get("merged", False)
    merge_commit_sha = pr.get("merge_commit_sha")
    repo_data = payload.get("repository") or {}
    github_repo_id = repo_data.get("id")

    if action == "closed" and is_merged and merge_commit_sha and github_repo_id:
        db = SessionLocal()
        try:
            stale_count = DocumentationStaleService.mark_stale_from_push(
                db,
                github_repo_id=github_repo_id,
                head_commit_sha=merge_commit_sha,
            )
            if stale_count > 0:
                logger.info(
                    "PR merged: Marked %d project document(s) as STALE for repo ID: %s",
                    stale_count,
                    github_repo_id,
                )
        except Exception:
            db.rollback()
            logger.exception("Pull request stale processing failed.")
        finally:
            db.close()


@router.post("/github")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_github_event: str = Header(alias="X-GitHub-Event"),
    x_hub_signature_256: str = Header(
        alias="X-Hub-Signature-256"
    ),
):
    body = await request.body()

    # Verify GitHub webhook signature.
    expected_signature = (
        "sha256="
        + hmac.new(
            settings.GITHUB_WEBHOOK_SECRET.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()
    )

    if not hmac.compare_digest(
        expected_signature,
        x_hub_signature_256,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid webhook signature.",
        )

    # Parse webhook payload.
    try:
        payload = json.loads(body)

        if not isinstance(payload, dict):
            raise ValueError("Payload must be a JSON object.")

    except (json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON payload.",
        )

    # Process supported events in the background so GitHub
    # receives a fast HTTP 200 response.

    if x_github_event == "installation":
        background_tasks.add_task(
            process_installation_event,
            payload,
        )

    elif x_github_event == "installation_repositories":
        background_tasks.add_task(
            process_repository_event,
            payload,
        )

    elif x_github_event == "push":
        background_tasks.add_task(
            process_push_event,
            payload,
        )

    elif x_github_event == "pull_request":
        background_tasks.add_task(
            process_pull_request_event,
            payload,
        )

    else:
        return {
            "received": True,
            "message": f"Event received: {x_github_event}",
        }

    return {
        "received": True,
        "message": "Webhook accepted for background processing.",
    }