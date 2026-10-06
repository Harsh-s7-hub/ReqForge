from pathlib import Path

from tree_sitter_language_pack import get_parser

from ai_services.abstract_syntax_tree.models.ast_models import (
    ASTNode,
    FileAST,
)


LANGUAGE_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".java": "java",
}


NAMED_DECLARATION_TYPES = {
    # Python
    "class_definition",
    "function_definition",

    # JavaScript / TypeScript
    "class_declaration",
    "function_declaration",
    "method_definition",

    # Java
    "method_declaration",
}


def detect_language(file_path: str) -> str | None:
    """Detect supported language from the file extension."""

    return LANGUAGE_MAP.get(
        Path(file_path).suffix.lower()
    )


def get_parser_for_file(file_path: str):
    """Return detected language and Tree-sitter parser."""

    language = detect_language(file_path)

    if not language:
        return None, None

    try:
        parser = get_parser(language)
        return language, parser

    except Exception as exc:
        print(
            f"Failed to load parser for {language}: {exc}"
        )

        return language, None


def _extract_node_name(node) -> str | None:
    """
    Extract the identifier associated with a declaration.
    """

    for child in node.named_children:

        if child.type in {
            "identifier",
            "type_identifier",
            "property_identifier",
            "field_identifier",
        }:

            if child.text:
                return child.text.decode("utf-8")

    return None


def build_node(node) -> ASTNode:
    """
    Convert a Tree-sitter node into our normalized ASTNode.
    """

    name = None

    if node.type in NAMED_DECLARATION_TYPES:
        name = _extract_node_name(node)

    text = None

    if node.text:
        try:
            text = node.text.decode("utf-8")
        except UnicodeDecodeError:
            text = None

    return ASTNode(
        node_type=node.type,
        name=name,
        text=text,
        start_line=node.start_point[0] + 1,
        end_line=node.end_point[0] + 1,
        children=[
            build_node(child)
            for child in node.named_children
        ],
    )


def parse_file(file_path: str) -> FileAST | None:
    """
    Parse a supported source file and return normalized AST.
    """

    language, parser = get_parser_for_file(file_path)

    if not language or parser is None:
        return None

    path = Path(file_path)

    try:
        source = path.read_bytes()

        tree = parser.parse(source)

        return FileAST(
            path=str(path),
            language=language,
            root=build_node(tree.root_node),
            parse_error=tree.root_node.has_error,
        )

    except Exception as exc:
        print(
            f"Failed to parse {file_path}: {exc}"
        )

        return None