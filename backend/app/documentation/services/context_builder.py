from __future__ import annotations

from ai_services.graph.neo4j_client import get_neo4j_client
from ai_services.qdrant.revision_retrieval_service import search_revision


DOCUMENTATION_QUERIES = (
    "repository architecture entry points and major components",
    "modules packages services and their responsibilities",
    "HTTP API routes request handlers and public interfaces",
    "installation setup configuration dependencies and runtime commands",
)


class DocumentationContextBuilder:
    """Builds bounded, source-attributed evidence for a documentation prompt."""

    def build(self, *, project_id: int, repository_id: int, analysis_id: int, commit_sha: str) -> str:
        graph_summary = self._graph_summary(project_id, analysis_id)
        chunks = self._retrieve_chunks(project_id, repository_id, commit_sha)
        return self._format_context(graph_summary, chunks)

    @staticmethod
    def _graph_summary(project_id: int, analysis_id: int) -> list[dict]:
        query = """
        MATCH (:Analysis {analysis_id: $analysis_id})-[:CONTAINS]->(file:File)
        WHERE file.project_id = $project_id
        OPTIONAL MATCH (file)-[:DEFINES_CLASS|DEFINES_FUNCTION]->(symbol)
        RETURN file.path AS path, file.language AS language,
               collect(DISTINCT symbol.name)[0..20] AS symbols
        ORDER BY path
        LIMIT 250
        """
        with get_neo4j_client() as neo4j:
            return neo4j.execute(query, {"project_id": project_id, "analysis_id": analysis_id})

    @staticmethod
    def _retrieve_chunks(project_id: int, repository_id: int, commit_sha: str) -> list[dict]:
        deduplicated: dict[str, dict] = {}
        for query in DOCUMENTATION_QUERIES:
            for chunk in search_revision(
                project_id=project_id,
                repository_id=repository_id,
                commit_sha=commit_sha,
                query=query,
                limit=5,
            ):
                deduplicated.setdefault(str(chunk.get("chunk_id")), chunk)
        return list(deduplicated.values())[:16]

    @staticmethod
    def _format_context(graph_summary: list[dict], chunks: list[dict]) -> str:
        graph_lines = [
            f"- {item.get('path')} ({item.get('language')}): {', '.join(item.get('symbols') or [])}"
            for item in graph_summary
        ]
        chunk_blocks = [
            "SOURCE: {path}:{start}-{end}\n---\n{content}\n---".format(
                path=chunk.get("file_path"),
                start=chunk.get("start_line"),
                end=chunk.get("end_line"),
                content=chunk.get("content"),
            )
            for chunk in chunks
        ]
        return "GRAPH SUMMARY\n" + "\n".join(graph_lines) + "\n\nRETRIEVED SOURCE\n" + "\n\n".join(chunk_blocks)
