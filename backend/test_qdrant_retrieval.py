
from ai_services.qdrant.retrieval_service import (
    index_repository_files,
    search_repository,
)

repository_id = "regforge-retrieval-test"

files = [
    {
        "file_path": "app/auth.py",
        "content": '''
async def github_login(code: str):
    """Exchange an OAuth authorization code for an access token."""
    token = await exchange_github_code(code)
    return token
''',
    },
    {
        "file_path": "app/graph.py",
        "content": '''
def build_dependency_graph(modules):
    """Build a graph representing dependencies between modules."""
    graph = {}
    for module in modules:
        graph[module.name] = module.dependencies
    return graph
''',
    },
    {
        "file_path": "app/docs.py",
        "content": '''
def generate_documentation(source_code: str):
    """Generate technical documentation from source code."""
    return analyze_source(source_code)
''',
    },
]

result = index_repository_files(repository_id, files)
print("Indexing result:", result)

queries = [
    "How does GitHub OAuth login work?",
    "Where are module dependencies represented as a graph?",
    "Which function generates technical documentation?",
]

for query in queries:
    print(f"\nQuery: {query}")

    results = search_repository(
        repository_id=repository_id,
        query=query,
        limit=3,
    )

    for item in results:
        print(
            f"File: {item['file_path']} "
            f"| Lines: {item['start_line']}-{item['end_line']} "
            f"| Score: {item['score']:.4f}"
        )
        print(item["content"])
