
import logging
import os
from functools import lru_cache

from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

DEFAULT_MODEL_NAME = "Qwen/Qwen3-Embedding-0.6B"
QUERY_INSTRUCTION = (
    "Given a question about a software repository, retrieve relevant "
    "source code, functions, classes, configuration, and documentation "
    "that answer the question."
)


def get_model_name() -> str:
    return os.getenv("EMBEDDING_MODEL_NAME", DEFAULT_MODEL_NAME)


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    model_name = get_model_name()
    logger.info("Loading local embedding model: %s", model_name)

    model = SentenceTransformer(model_name, device="cpu")

    dimension = model.get_sentence_embedding_dimension()
    logger.info("Embedding model loaded; dimension=%s", dimension)

    return model


def get_embedding_dimension() -> int:
    dimension = get_embedding_model().get_sentence_embedding_dimension()

    if dimension is None:
        raise RuntimeError("Could not determine embedding dimension.")

    return int(dimension)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed code chunks as documents for retrieval."""
    if not texts:
        return []

    if any(not isinstance(text, str) or not text.strip() for text in texts):
        raise ValueError("All embedding inputs must be non-empty strings.")

    model = get_embedding_model()

    vectors = model.encode_document(
        texts,
        batch_size=8,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    )

    return vectors.tolist()


def embed_query(query: str) -> list[float]:
    """Embed a user's search query using Qwen's query encoding path."""
    if not isinstance(query, str) or not query.strip():
        raise ValueError("Search query must not be empty.")

    model = get_embedding_model()

    vector = model.encode_query(
        query.strip(),
        prompt=QUERY_INSTRUCTION,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    )

    return vector.tolist()
