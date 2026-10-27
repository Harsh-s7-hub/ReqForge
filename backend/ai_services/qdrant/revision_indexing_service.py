"""Immutable, commit-scoped Qdrant indexing for documentation generation."""

from __future__ import annotations

import hashlib
import uuid
from pathlib import Path

from qdrant_client import models

from .chunking_service import chunk_repository_files, should_index_file
from .embedding_service import embed_texts, get_embedding_dimension
from .qdrant_client import ensure_collection, get_qdrant_client


POINT_NAMESPACE = uuid.UUID("2a06f291-7c9d-43df-82a7-5157c8d40a87")
MAX_FILE_BYTES = 1_000_000


def _point_id(
    project_id: int,
    repository_id: int,
    commit_sha: str,
    chunk_id: str,
) -> str:
    identity = f"{project_id}:{repository_id}:{commit_sha}:{chunk_id}"
    return str(uuid.uuid5(POINT_NAMESPACE, identity))


def _snapshot_files(snapshot_root: Path) -> list[dict[str, str]]:
    files: list[dict[str, str]] = []

    for path in snapshot_root.rglob("*"):
        if not path.is_file():
            continue

        relative_path = path.relative_to(snapshot_root).as_posix()
        if not should_index_file(relative_path):
            continue

        try:
            if path.stat().st_size > MAX_FILE_BYTES:
                continue
            content = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue

        if content.strip():
            files.append({"file_path": relative_path, "content": content})

    return files


def _ensure_payload_indexes(collection_name: str) -> None:
    client = get_qdrant_client()
    for field_name in (
        "project_id",
        "repository_id",
        "analysis_id",
        "commit_sha",
    ):
        client.create_payload_index(
            collection_name=collection_name,
            field_name=field_name,
            field_schema=models.PayloadSchemaType.KEYWORD,
            wait=True,
        )


def index_revision_snapshot(
    *,
    project_id: int,
    repository_id: int,
    github_repository_id: int,
    analysis_id: int,
    commit_sha: str,
    snapshot_root: Path,
    batch_size: int = 32,
) -> dict:
    """Upsert all eligible source chunks for one immutable source revision.

    Point identities include the commit SHA, so a retry replaces only its own
    revision's points and cannot overwrite a different analysis or commit.
    """
    if min(project_id, repository_id, github_repository_id, analysis_id) <= 0:
        raise ValueError("Project, repository, GitHub repository, and analysis IDs are required.")
    if len(commit_sha) != 40:
        raise ValueError("commit_sha must be a full 40-character SHA.")
    if batch_size <= 0:
        raise ValueError("batch_size must be greater than zero.")

    files = _snapshot_files(snapshot_root)
    chunks = chunk_repository_files(
        repository_id=str(repository_id),
        files=files,
    )
    collection_name = ensure_collection(get_embedding_dimension())
    _ensure_payload_indexes(collection_name)

    client = get_qdrant_client()
    indexed_count = 0

    for offset in range(0, len(chunks), batch_size):
        batch = chunks[offset : offset + batch_size]
        vectors = embed_texts([chunk["content"] for chunk in batch])
        points = []

        for chunk, vector in zip(batch, vectors):
            content_hash = hashlib.sha256(
                chunk["content"].encode("utf-8")
            ).hexdigest()
            payload = {
                "project_id": str(project_id),
                "repository_id": str(repository_id),
                "github_repository_id": str(github_repository_id),
                "analysis_id": str(analysis_id),
                "commit_sha": commit_sha,
                "chunk_id": chunk["chunk_id"],
                "file_path": chunk["file_path"],
                "language": chunk["language"],
                "start_line": chunk["start_line"],
                "end_line": chunk["end_line"],
                "content_hash": content_hash,
                "content": chunk["content"],
            }
            points.append(
                models.PointStruct(
                    id=_point_id(project_id, repository_id, commit_sha, chunk["chunk_id"]),
                    vector=vector,
                    payload=payload,
                )
            )

        client.upsert(
            collection_name=collection_name,
            points=points,
            wait=True,
        )
        indexed_count += len(points)

    return {
        "project_id": project_id,
        "repository_id": repository_id,
        "analysis_id": analysis_id,
        "commit_sha": commit_sha,
        "files_indexed": len(files),
        "chunks_indexed": indexed_count,
    }
