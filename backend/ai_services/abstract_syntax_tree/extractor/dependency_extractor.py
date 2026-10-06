from dataclasses import dataclass

from ai_services.abstract_syntax_tree.models.ast_models import (
    ASTNode,
    FileAST,
)


@dataclass
class Dependency:
    """
    Represents a source-level dependency.
    """

    source_file: str
    target: str
    dependency_type: str
    line: int


def extract_dependencies(
    file_ast: FileAST,
) -> list[Dependency]:
    """
    Extract import dependencies from a source file.
    """

    dependencies: list[Dependency] = []

    def walk(node: ASTNode) -> None:

        targets: list[str] = []

        if file_ast.language == "python":
            targets = _extract_python_imports(node)

        elif file_ast.language in {
            "javascript",
            "typescript",
            "tsx",
        }:
            targets = _extract_javascript_imports(node)

        elif file_ast.language == "java":
            targets = _extract_java_imports(node)

        for target in targets:

            dependencies.append(
                Dependency(
                    source_file=file_ast.path,
                    target=target,
                    dependency_type="IMPORTS",
                    line=node.start_line,
                )
            )

        for child in node.children:
            walk(child)

    walk(file_ast.root)

    return dependencies


def _extract_python_imports(
    node: ASTNode,
) -> list[str]:

    if node.node_type == "import_statement":

        if not node.text:
            return []

        text = node.text.strip()

        # Example:
        # import requests
        # import os
        # import app.database

        text = text.removeprefix("import ").strip()

        imports = []

        for item in text.split(","):

            item = item.strip()

            if " as " in item:
                item = item.split(" as ")[0].strip()

            if item:
                imports.append(item)

        return imports

    if node.node_type == "import_from_statement":

        if not node.text:
            return []

        text = node.text.strip()

        # Example:
        # from app.database import db
        # from services.auth import login

        if not text.startswith("from "):
            return []

        remainder = text[5:]

        if " import " not in remainder:
            return []

        module = remainder.split(
            " import ",
            1,
        )[0].strip()

        if module:
            return [module]

    return []


def _extract_javascript_imports(
    node: ASTNode,
) -> list[str]:

    if node.node_type not in {
        "import_statement",
        "import_declaration",
    }:
        return []

    if not node.text:
        return []

    text = node.text.strip()

    # Example:
    # import auth from "./auth";
    # import { User } from "./models/user";
    # import "./setup";

    if " from " in text:

        target = text.split(
            " from ",
            1,
        )[1].strip()

        return [_clean_import_target(target)]

    # Side-effect import:
    # import "./setup";

    if text.startswith("import "):

        target = text[len("import "):].strip()

        return [_clean_import_target(target)]

    return []


def _extract_java_imports(
    node: ASTNode,
) -> list[str]:

    if node.node_type != "import_declaration":
        return []

    if not node.text:
        return []

    text = node.text.strip()

    # Example:
    # import java.util.List;
    # import com.example.User;

    if not text.startswith("import "):
        return []

    target = text[len("import "):].strip()

    target = target.rstrip(";").strip()

    # Remove static keyword if present.
    target = target.removeprefix(
        "static "
    ).strip()

    return [target] if target else []


def _clean_import_target(
    target: str,
) -> str:

    target = target.strip()

    target = target.rstrip(";")

    target = target.strip()

    # Remove quotes.
    if (
        len(target) >= 2
        and target[0] in {"'", '"'}
        and target[-1] == target[0]
    ):
        target = target[1:-1]

    return target


def extract_dependencies_from_file(
    file_path: str,
) -> list[Dependency]:
    """
    Convenience function for parsing a file and
    extracting dependencies.
    """

    from ai_services.abstract_syntax_tree.parser.language_parser import (
        parse_file,
    )

    file_ast = parse_file(file_path)

    if file_ast is None:
        return []

    return extract_dependencies(file_ast)