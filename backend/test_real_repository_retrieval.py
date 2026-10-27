
from ai_services.qdrant.retrieval_service import search_repository


REPOSITORY_ID = "1247530583"

queries = [
    "Where is the application configured and started?",
    "How does the backend handle API routes and HTTP requests?",
    "Where are database models and database connections defined?",
]

for query in queries:
    print(f"\n{'=' * 70}")
    print(f"Query: {query}")
    print("=" * 70)

    results = search_repository(
        repository_id=REPOSITORY_ID,
        query=query,
        limit=3,
    )

    if not results:
        print("No matching code chunks found.")
        continue

    for rank, result in enumerate(results, start=1):
        print(
            f"\nRank: {rank}"
            f"\nFile: {result['file_path']}"
            f"\nLines: {result['start_line']}-{result['end_line']}"
            f"\nScore: {result['score']:.4f}"
        )
        print("-" * 50)
        print(result["content"][:1500])
