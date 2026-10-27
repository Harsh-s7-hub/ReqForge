
from __future__ import annotations

import asyncio
import base64
import logging
from urllib.parse import quote

import httpx
from sqlalchemy.orm import Session

from app.auth.github_app import generate_installation_token
from app.models.github_installation import GitHubInstallation
from app.models.github_repositories import GitHubRepository
from ai_services.qdrant.chunking_service import should_index_file
from ai_services.qdrant.retrieval_service import index_repository_files

logger = logging.getLogger(__name__)

GITHUB_API_URL = "https://api.github.com"
GITHUB_API_VERSION = "2022-11-28"

MAX_FILE_BYTES = 1_000_000
MAX_FILES_PER_INDEX = 5_000
MAX_CONCURRENT_REQUESTS = 8


class GitHubCodeIndexingError(RuntimeError):
    """Raised when repository source code cannot be indexed safely."""


def _github_headers(access_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    }


async def _fetch_repository_tree(
    client: httpx.AsyncClient,
    owner: str,
    repository_name: str,
    branch: str,
) -> list[dict]:
    owner_path = quote(owner, safe="")
    repository_path = quote(repository_name, safe="")
    branch_path = quote(branch, safe="")

    url = (
        f"{GITHUB_API_URL}/repos/{owner_path}/"
        f"{repository_path}/git/trees/{branch_path}"
    )

    response = await client.get(
        url,
        params={"recursive": "1"},
    )
    response.raise_for_status()

    data = response.json()
    tree = data.get("tree")

    if not isinstance(tree, list):
        raise GitHubCodeIndexingError(
            "GitHub returned an invalid repository tree."
        )

    # GitHub can truncate recursive trees for very large repositories.
    # Never treat a partial tree as a complete repository snapshot.
    if data.get("truncated"):
        raise GitHubCodeIndexingError(
            "GitHub truncated the repository tree. "
            "Indexing was stopped to avoid treating partial results "
            "as a complete repository."
        )

    return tree


async def _fetch_blob_content(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    owner: str,
    repository_name: str,
    blob_sha: str,
    file_path: str,
) -> dict:
    owner_path = quote(owner, safe="")
    repository_path = quote(repository_name, safe="")
    blob_path = quote(blob_sha, safe="")

    url = (
        f"{GITHUB_API_URL}/repos/{owner_path}/"
        f"{repository_path}/git/blobs/{blob_path}"
    )

    async with semaphore:
        response = await client.get(url)
        response.raise_for_status()

    data = response.json()

    if data.get("encoding") != "base64":
        raise GitHubCodeIndexingError(
            f"Unsupported GitHub blob encoding for {file_path}."
        )

    encoded_content = data.get("content")

    if not isinstance(encoded_content, str):
        raise GitHubCodeIndexingError(
            f"GitHub returned invalid blob content for {file_path}."
        )

    try:
        raw_content = base64.b64decode(encoded_content)
    except (ValueError, TypeError) as exc:
        raise GitHubCodeIndexingError(
            f"Could not decode GitHub blob for {file_path}."
        ) from exc

    # GitHub may include whitespace in base64 response content.
    # Reject files that exceed our limit after decoding as well.
    if len(raw_content) > MAX_FILE_BYTES:
        raise GitHubCodeIndexingError(
            f"File exceeded the indexing size limit: {file_path}."
        )

    try:
        content = raw_content.decode("utf-8")
    except UnicodeDecodeError:
        # Binary or non-UTF-8 files should not be sent to embeddings.
        logger.debug("Skipping non-UTF-8 file: %s", file_path)
        return {
            "file_path": file_path,
            "content": None,
        }

    return {
        "file_path": file_path,
        "content": content,
    }


async def index_github_repository(
    db: Session,
    repository_db_id: int,
) -> dict:
    """
    Fetch and index the default branch of a stored GitHub repository.

    Args:
        db:
            An existing SQLAlchemy database session.
        repository_db_id:
            The internal GitHubRepository.id value in RegForge.

    Returns:
        A summary of the files fetched and chunks indexed.

    Notes:
        - The Qdrant scope uses GitHubRepository.github_repo_id.
        - The repository and its installation must be active.
        - This function does not commit database changes.
        - This initial version upserts current chunks but does not
          remove stale chunks from previous indexing runs.
    """
    repository = (
        db.query(GitHubRepository)
        .filter(GitHubRepository.id == repository_db_id)
        .first()
    )

    if not repository:
        raise ValueError(
            f"Repository record {repository_db_id} was not found."
        )

    if not repository.is_active:
        raise ValueError(
            "Cannot index an inactive GitHub repository."
        )

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.id
            == repository.github_installation_id
        )
        .first()
    )

    if not installation or not installation.is_active:
        raise ValueError(
            "The repository's GitHub installation is missing or inactive."
        )

    access_token = await generate_installation_token(
        installation.installation_id
    )

    if not access_token:
        raise GitHubCodeIndexingError(
            "GitHub did not return an installation access token."
        )

    owner = repository.owner_login
    repository_name = repository.name

    async with httpx.AsyncClient(
        headers=_github_headers(access_token),
        timeout=45.0,
    ) as client:
        branch = repository.default_branch

        if not branch:
            metadata_url = (
                f"{GITHUB_API_URL}/repos/"
                f"{quote(owner, safe='')}/"
                f"{quote(repository_name, safe='')}"
            )

            response = await client.get(metadata_url)
            response.raise_for_status()

            branch = response.json().get("default_branch")

        if not isinstance(branch, str) or not branch:
            raise GitHubCodeIndexingError(
                "Could not determine the repository's default branch."
            )

        tree = await _fetch_repository_tree(
            client=client,
            owner=owner,
            repository_name=repository_name,
            branch=branch,
        )

        eligible_blobs = []

        for item in tree:
            if item.get("type") != "blob":
                continue

            file_path = item.get("path")
            blob_sha = item.get("sha")
            file_size = item.get("size")

            if not isinstance(file_path, str) or not isinstance(
                blob_sha, str
            ):
                continue

            if not should_index_file(file_path):
                continue

            if not isinstance(file_size, int) or file_size < 0:
                continue

            if file_size > MAX_FILE_BYTES:
                logger.info(
                    "Skipping oversized file %s in %s",
                    file_path,
                    repository.full_name,
                )
                continue

            eligible_blobs.append(
                {
                    "file_path": file_path,
                    "sha": blob_sha,
                }
            )

        if len(eligible_blobs) > MAX_FILES_PER_INDEX:
            raise GitHubCodeIndexingError(
                f"Repository contains more than {MAX_FILES_PER_INDEX} "
                "eligible files. Indexing was stopped to avoid an "
                "unexpectedly large operation."
            )

        semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

        tasks = [
            _fetch_blob_content(
                client=client,
                semaphore=semaphore,
                owner=owner,
                repository_name=repository_name,
                blob_sha=item["sha"],
                file_path=item["file_path"],
            )
            for item in eligible_blobs
        ]

        # Fail the operation if any request fails. Do not silently
        # report an incomplete repository as successfully indexed.
        fetched_files = await asyncio.gather(*tasks)

    source_files = [
        item
        for item in fetched_files
        if isinstance(item.get("content"), str)
        and item["content"].strip()
    ]

    # Use GitHub's globally unique repository ID as the vector scope.
    result = index_repository_files(
        repository_id=str(repository.github_repo_id),
        files=source_files,
    )

    summary = {
        "repository_db_id": repository.id,
        "github_repo_id": repository.github_repo_id,
        "repository": repository.full_name,
        "branch": branch,
        "eligible_files": len(eligible_blobs),
        "files_fetched": len(source_files),
        "chunks_created": result["chunks_created"],
        "chunks_indexed": result["chunks_indexed"],
    }

    logger.info("GitHub code indexing completed: %s", summary)

    return summary
