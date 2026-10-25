
import logging
import os
from functools import lru_cache

from qdrant_client import QdrantClient
from qdrant_client.http import models

logger = logging.getLogger(__name__)

DEFAULT_COLLECTION_NAME = "reqforge_code_chunks"


def _get_qdrant_url() -> str:
    """
    Resolve the Qdrant URL from the environment.

    Local backend:
        http://localhost:6333

    Backend running inside Docker:
        http://host.docker.internal:6333
        (when Qdrant's port is published on the host)
    """
    return os.getenv(
        "QDRANT_URL",
        "http://localhost:6333",
    ).rstrip("/")


def get_collection_name() -> str:
    """Return the configured Qdrant collection name."""
    return os.getenv(
        "QDRANT_COLLECTION",
        DEFAULT_COLLECTION_NAME,
    )


@lru_cache(maxsize=1)
def get_qdrant_client() -> QdrantClient:
    """
    Create and cache the Qdrant client.

    The client connects lazily; this function does not create
    a collection or insert any vectors.
    """
    url = _get_qdrant_url()

    logger.info("Configuring Qdrant client: %s", url)

    return QdrantClient(
        url=url,
        timeout=10.0,
    )


def check_qdrant_connection() -> bool:
    """
    Check whether Qdrant is reachable.

    Returns:
        True if Qdrant responds successfully.

    Raises:
        Exception if the connection or health check fails.
    """
    client = get_qdrant_client()

    client.get_collections()

    logger.info("Qdrant connection successful.")

    return True


def ensure_collection(
    vector_size: int,
    collection_name: str | None = None,
) -> str:
    """
    Create the collection if it does not already exist.

    Args:
        vector_size: Dimension of vectors produced by the
            selected embedding model.
        collection_name: Optional collection name override.

    Returns:
        The collection name.

    Raises:
        ValueError: If vector_size is invalid.
        Exception: If Qdrant cannot create or inspect the collection.

    Important:
        Existing collections are not silently recreated if their
        vector dimensions differ from the requested dimensions.
    """
    if vector_size <= 0:
        raise ValueError("vector_size must be greater than zero.")

    client = get_qdrant_client()
    name = collection_name or get_collection_name()

    existing_collections = client.get_collections()

    exists = any(
        collection.name == name
        for collection in existing_collections.collections
    )

    if not exists:
        client.create_collection(
            collection_name=name,
            vectors_config=models.VectorParams(
                size=vector_size,
                distance=models.Distance.COSINE,
            ),
        )

        logger.info(
            "Created Qdrant collection '%s' with vector size %s.",
            name,
            vector_size,
        )

        return name

    collection_info = client.get_collection(name)

    vector_config = collection_info.config.params.vectors

    # This module currently uses a single, unnamed dense vector.
    if not isinstance(vector_config, models.VectorParams):
        raise ValueError(
            f"Collection '{name}' does not use the expected "
            "single dense-vector configuration."
        )

    if vector_config.size != vector_size:
        raise ValueError(
            f"Collection '{name}' has vector size "
            f"{vector_config.size}, but the configured embedding "
            f"model requires {vector_size}. Choose a compatible "
            "collection or migrate the existing vectors."
        )

    if vector_config.distance != models.Distance.COSINE:
        raise ValueError(
            f"Collection '{name}' uses distance metric "
            f"{vector_config.distance}; expected COSINE."
        )

    logger.info(
        "Qdrant collection '%s' already exists and is compatible.",
        name,
    )

    return name


def close_qdrant_client() -> None:
    """Close the cached client during application shutdown."""
    if get_qdrant_client.cache_info().currsize:
        client = get_qdrant_client()
        client.close()
        get_qdrant_client.cache_clear()
        logger.info("Qdrant client closed.")
