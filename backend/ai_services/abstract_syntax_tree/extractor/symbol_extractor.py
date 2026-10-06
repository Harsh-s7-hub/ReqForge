from dataclasses import dataclass, field
from pathlib import Path

from ai_services.abstract_syntax_tree.models.ast_models import (
    ASTNode,
    FileAST,
)


@dataclass
class Symbol:
    """
    Represents a source-code symbol that can become a graph node.
    """

    name: str
    symbol_type: str
    file_path: str
    start_line: int
    end_line: int
    parent_name: str | None = None
    children: list["Symbol"] = field(default_factory=list)


def extract_symbols(file_ast: FileAST) -> list[Symbol]:
    """
    Extract classes and functions/methods from a normalized AST.

    Supported symbol types:
    - class
    - function
    - method
    """

    symbols: list[Symbol] = []

    def walk(
        node: ASTNode,
        parent_class: str | None = None,
    ) -> None:

        current_parent = parent_class

        if node.node_type in {
            "class_definition",
            "class_declaration",
            "class",
        }:
            name = _extract_node_name(node)

            if name:
                symbol = Symbol(
                    name=name,
                    symbol_type="class",
                    file_path=file_ast.path,
                    start_line=node.start_line,
                    end_line=node.end_line,
                )

                symbols.append(symbol)
                current_parent = name

        elif node.node_type in {
            "function_definition",
            "function_declaration",
            "method_definition",
            "method_declaration",
            "arrow_function",
        }:
            name = _extract_node_name(node)

            if name:
                symbol_type = (
                    "method"
                    if parent_class
                    else "function"
                )

                symbols.append(
                    Symbol(
                        name=name,
                        symbol_type=symbol_type,
                        file_path=file_ast.path,
                        start_line=node.start_line,
                        end_line=node.end_line,
                        parent_name=parent_class,
                    )
                )

        for child in node.children:
            walk(child, current_parent)

    walk(file_ast.root)

    return symbols


def _extract_node_name(node: ASTNode) -> str | None:
    """
    Extract the symbol name from an AST node.

    The current normalized AST does not yet populate `name`,
    so this function first uses `node.name`.

    Name extraction from raw Tree-sitter nodes will be added
    when the parser is enhanced with source-aware identifiers.
    """

    if node.name:
        return node.name

    return None


def extract_symbols_from_file(
    file_path: str,
) -> list[Symbol]:
    """
    Convenience function for parsing a source file and
    extracting its symbols.
    """

    from ai_services.abstract_syntax_tree.parser.language_parser import (
        parse_file,
    )

    file_ast = parse_file(file_path)

    if file_ast is None:
        return []

    return extract_symbols(file_ast)