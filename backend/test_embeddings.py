
from ai_services.qdrant.embedding_service import (
    embed_query,
    embed_texts,
    get_embedding_dimension,
)

documents = [
    "This function authenticates users through GitHub OAuth.",
    "This function builds a dependency graph of repository modules.",
    "This function generates technical documentation.",
]

vectors = embed_texts(documents)
query_vector = embed_query("How does GitHub login work?")

print("Model dimension:", get_embedding_dimension())
print("Document vectors:", len(vectors))
print("Document vector dimension:", len(vectors[0]))
print("Query vector dimension:", len(query_vector))

assert get_embedding_dimension() == 1024
assert all(len(vector) == 1024 for vector in vectors)
assert len(query_vector) == 1024

print("Embedding test passed.")
