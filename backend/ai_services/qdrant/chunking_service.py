
from __future__ import annotations

import hashlib
from pathlib import PurePosixPath

DEFAULT_CHUNK_LINES = 100
DEFAULT_OVERLAP_LINES = 15

IGNORED_DIRECTORIES = {
    ".git", ".venv", "venv", "node_modules", "__pycache__",
    ".next", "dist", "build", "coverage", ".pytest_cache",
    ".mypy_cache", ".ruff_cache", "vendor",
}

SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".kt",
    ".go", ".rs", ".c", ".h", ".cpp", ".hpp", ".cs",
    ".php", ".rb", ".swift", ".scala", ".sql", ".html",
    ".css", ".scss", ".json", ".yaml", ".yml", ".toml",
    ".ini", ".md", ".mdx", ".sh", ".ps1", ".dockerfile",
    ".xml", ".graphql", ".proto",
}

SPECIAL_FILENAMES = {
    "Dockerfile", "Makefile", "Jenkinsfile", ".gitignore",
    ".dockerignore", ".env.example",
}


def _language_for_path(file_path: str) -> str:
    path = PurePosixPath(file_path)
    suffix = path.suffix.lower()

    if path.name in SPECIAL_FILENAMES:
        return path.name

    return suffix.lstrip(".") or "text"


def _stable_chunk_id(
    repository_id: str,
    file_path: str,
    start_line: int,
    content: str,
) -> str:
    raw = f"{repository_id}:{file_path}:{start_line}:{content}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def should_index_file(file_path: str) -> bool:
    """Return whether a repository path is suitable for indexing."""
    path = PurePosixPath(file_path)

    if path.is_absolute() or ".." in path.parts:
        return False

    if any(part in IGNORED_DIRECTORIES for part in path.parts):
        return False

    if path.name in SPECIAL_FILENAMES:
        return True

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        return False

    # Avoid indexing common generated or lock files as source code.
    if path.name in {
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "poetry.lock",
    }:
        return False

    return True


def chunk_source_file(
    repository_id: str,
    file_path: str,
    content: str,
    chunk_lines: int = DEFAULT_CHUNK_LINES,
    overlap_lines: int = DEFAULT_OVERLAP_LINES,
) -> list[dict]:
    """
    Split one source file into line-based chunks.

    Each result includes deterministic identity and source metadata.
    Line numbers are one-based and inclusive.
    """
    if not repository_id.strip():
        raise ValueError("repository_id must not be empty.")

    if not file_path.strip():
        raise ValueError("file_path must not be empty.")

    if chunk_lines <= 0:
        raise ValueError("chunk_lines must be greater than zero.")

    if overlap_lines < 0 or overlap_lines >= chunk_lines:
        raise ValueError(
            "overlap_lines must be non-negative and smaller than chunk_lines."
        )

    if not content or not content.strip():
        return []

    if not should_index_file(file_path):
        return []

    lines = content.splitlines()
    if not lines:
        return []

    language = _language_for_path(file_path)
    chunks = []
    step = chunk_lines - overlap_lines

    for start in range(0, len(lines), step):
        end = min(start + chunk_lines, len(lines))
        chunk_content = "\n".join(lines[start:end])

        if not chunk_content.strip():
            continue

        start_line = start + 1
        end_line = end

        chunk_id = _stable_chunk_id(
            repository_id,
            file_path,
            start_line,
            chunk_content,
        )

        chunks.append(
            {
                "chunk_id": chunk_id,
                "repository_id": str(repository_id),
                "file_path": file_path.replace("\\", "/"),
                "language": language,
                "start_line": start_line,
                "end_line": end_line,
                "content": chunk_content,
            }
        )

        if end == len(lines):
            break

    return chunks


def chunk_repository_files(
    repository_id: str,
    files: list[dict],
    chunk_lines: int = DEFAULT_CHUNK_LINES,
    overlap_lines: int = DEFAULT_OVERLAP_LINES,
) -> list[dict]:
    """
    Chunk repository files.

    Expected input:
        [
            {"file_path": "src/main.py", "content": "..."},
            {"file_path": "README.md", "content": "..."},
        ]
    """
    all_chunks = []

    for file in files:
        file_path = file.get("file_path") or file.get("path")
        content = file.get("content")

        if not isinstance(file_path, str):
            continue

        if not isinstance(content, str):
            continue

        all_chunks.extend(
            chunk_source_file(
                repository_id=repository_id,
                file_path=file_path,
                content=content,
                chunk_lines=chunk_lines,
                overlap_lines=overlap_lines,
            )
        )

    return all_chunks
