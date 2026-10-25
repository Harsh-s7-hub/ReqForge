
from __future__ import annotations

import logging
import uuid

from qdrant_client import models

from .chunking_service import chunk_repository_files
from .embedding_service import (
    embed_query,
    embed_texts,
    get_embedding_dimension,
)
from .qdrant_client import (
    ensure_collection,
    get_collection_name,
    get_qdrant_client,
)

logger = logging.getLogger(__name__)

POINT_NAMESPACE = uuid.UUID("d2f6b6c2-4b6f-4c85-ae61-9a6b771d1b4e")


def _point_id(chunk_id: str) -> str:
    """Convert a stable chunk hash into a deterministic Qdrant UUID."""
    return str(uuid.uuid5(POINT_NAMESPACE, chunk_id))


def index_repository_files(
    repository_id: str,
    files: list[dict],
    batch_size: int = 32,
) -> dict:
    """
    Chunk and index repository files in Qdrant.

    Each file should contain:
        file_path (or path): repository-relative path
        content: decoded text content

    Returns indexing counts. It does not delete old chunks for files
    that have disappeared from the repository.
    """
    if not repository_id or not repository_id.strip():
        raise ValueError("repository_id must not be empty.")

    if batch_size <= 0:
        raise ValueError("batch_size must be greater than zero.")

    chunks = chunk_repository_files(
        repository_id=repository_id,
        files=files,
    )

    if not chunks:
        return {
            "repository_id": repository_id,
            "files_received": len(files),
            "chunks_created": 0,
            "chunks_indexed": 0,
        }

    collection_name = ensure_collection(
        vector_size=get_embedding_dimension(),
    )

    client = get_qdrant_client()
    indexed = 0

    for offset in range(0, len(chunks), batch_size):
        batch = chunks[offset : offset + batch_size]
        vectors = embed_texts([chunk["content"] for chunk in batch])

        points = []

        for chunk, vector in zip(batch, vectors):
            payload = {
                "repository_id": str(repository_id),
                "chunk_id": chunk["chunk_id"],
                "file_path": chunk["file_path"],
                "language": chunk["language"],
                "start_line": chunk["start_line"],
                "end_line": chunk["end_line"],
                "content": chunk["content"],
            }

            points.append(
                models.PointStruct(
                    id=_point_id(chunk["chunk_id"]),
                    vector=vector,
                    payload=payload,
                )
            )

        client.upsert(
            collection_name=collection_name,
            points=points,
            wait=True,
        )

        indexed += len(points)

    logger.info(
        "Indexed %s chunks for repository %s",
        indexed,
        repository_id,
    )

    return {
        "repository_id": repository_id,
        "files_received": len(files),
        "chunks_created": len(chunks),
        "chunks_indexed": indexed,
    }


def search_repository(
    repository_id: str,
    query: str,
    limit: int = 5,
    score_threshold: float | None = None,
) -> list[dict]:
    """
    Retrieve the most semantically relevant chunks from one repository.

    Results include source paths, line ranges, content and similarity
    scores. The threshold is optional because useful score ranges vary
    by model and query.
    """
    if not repository_id or not repository_id.strip():
        raise ValueError("repository_id must not be empty.")

    if not query or not query.strip():
        raise ValueError("query must not be empty.")

    if limit <= 0:
        raise ValueError("limit must be greater than zero.")

    client = get_qdrant_client()
    collection_name = get_collection_name()

    vector = embed_query(query)

    response = client.query_points(
        collection_name=collection_name,
        query=vector,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="repository_id",
                    match=models.MatchValue(value=str(repository_id)),
                )
            ]
        ),
        limit=limit,
        score_threshold=score_threshold,
        with_payload=True,
        with_vectors=False,
    )

    results = []

    for point in response.points:
        payload = point.payload or {}

        results.append(
            {
                "chunk_id": payload.get("chunk_id"),
                "repository_id": payload.get("repository_id"),
                "file_path": payload.get("file_path"),
                "language": payload.get("language"),
                "start_line": payload.get("start_line"),
                "end_line": payload.get("end_line"),
                "content": payload.get("content"),
                "score": point.score,
            }
        )

    return results
