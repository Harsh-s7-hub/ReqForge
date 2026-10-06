from pathlib import Path

from ai_services.abstract_syntax_tree.parser.language_parser import (
    parse_file,
)


IGNORED_DIRECTORIES = {
    ".git",
    ".github",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    ".next",
    "dist",
    "build",
    "target",
    "coverage",
}


SUPPORTED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
}


def should_ignore(path: Path) -> bool:
    return any(
        directory in path.parts
        for directory in IGNORED_DIRECTORIES
    )


def analyze_repository(repository_path: str) -> dict:
    root = Path(repository_path)

    if not root.exists():
        raise FileNotFoundError(
            f"Repository does not exist: {repository_path}"
        )

    files_scanned = 0
    files_parsed = 0
    unsupported_files = 0
    parse_errors = 0

    languages: dict[str, int] = {}
    parsed_files = []

    for file_path in root.rglob("*"):

        if not file_path.is_file():
            continue

        if should_ignore(file_path):
            continue

        files_scanned += 1

        extension = file_path.suffix.lower()

        if extension not in SUPPORTED_EXTENSIONS:
            unsupported_files += 1
            continue

        result = parse_file(str(file_path))

        if result is None:
            continue

        files_parsed += 1

        languages[result.language] = (
            languages.get(result.language, 0) + 1
        )

        if result.parse_error:
            parse_errors += 1

        parsed_files.append(result)

    return {
        "repository": str(root),
        "files_scanned": files_scanned,
        "files_parsed": files_parsed,
        "unsupported_files": unsupported_files,
        "parse_errors": parse_errors,
        "languages": languages,
        "files": parsed_files,
    }