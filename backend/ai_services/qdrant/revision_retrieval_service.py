"""Commit-scoped semantic retrieval used by documentation generation."""

from qdrant_client import models

from .embedding_service import embed_query
from .qdrant_client import get_collection_name, get_qdrant_client


def search_revision(
    *,
    project_id: int,
    repository_id: int,
    commit_sha: str,
    query: str,
    limit: int = 8,
) -> list[dict]:
    """Return chunks only from the requested project, repository, and commit."""
    if min(project_id, repository_id) <= 0:
        raise ValueError("project_id and repository_id are required.")
    if len(commit_sha) != 40:
        raise ValueError("commit_sha must be a full 40-character SHA.")
    if not query.strip():
        raise ValueError("query must not be empty.")

    response = get_qdrant_client().query_points(
        collection_name=get_collection_name(),
        query=embed_query(query),
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="project_id",
                    match=models.MatchValue(value=str(project_id)),
                ),
                models.FieldCondition(
                    key="repository_id",
                    match=models.MatchValue(value=str(repository_id)),
                ),
                models.FieldCondition(
                    key="commit_sha",
                    match=models.MatchValue(value=commit_sha),
                ),
            ]
        ),
        limit=limit,
        with_payload=True,
        with_vectors=False,
    )

    return [
        {**(point.payload or {}), "score": point.score}
        for point in response.points
    ]
