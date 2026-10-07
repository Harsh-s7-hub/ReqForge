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
            "jsx",
        }:
            targets = _extract_javascript_imports(node)

        elif file_ast.language == "java":
            targets = _extract_java_imports(node)

        for target in targets:

            if not target:
                continue

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

    # ----------------------------------------------------------
    # import foo
    # import foo.bar
    # import foo as f
    # ----------------------------------------------------------

    if node.node_type == "import_statement":

        if not node.text:
            return []

        text = node.text.strip()

        if not text.startswith("import "):
            return []

        text = text[len("import "):].strip()

        imports: list[str] = []

        for item in text.split(","):

            item = item.strip()

            if " as " in item:
                item = item.split(
                    " as ",
                    1,
                )[0].strip()

            if item:
                imports.append(item)

        return imports

    # ----------------------------------------------------------
    # from foo.bar import baz
    # from .foo import baz
    # from ..services import auth
    # ----------------------------------------------------------

    if node.node_type == "import_from_statement":

        if not node.text:
            return []

        text = node.text.strip()

        if not text.startswith("from "):
            return []

        remainder = text[len("from "):]

        if " import " not in remainder:
            return []

        module = remainder.split(
            " import ",
            1,
        )[0].strip()

        return [module] if module else []

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

    # ----------------------------------------------------------
    # import auth from "./auth";
    # import { User } from "./models/user";
    # ----------------------------------------------------------

    if " from " in text:

        target = text.split(
            " from ",
            1,
        )[1].strip()

        target = _clean_import_target(
            target
        )

        return [target] if target else []

    # ----------------------------------------------------------
    # import "./setup";
    # ----------------------------------------------------------

    if text.startswith("import "):

        target = text[
            len("import "):
        ].strip()

        target = _clean_import_target(
            target
        )

        return [target] if target else []

    return []


def _extract_java_imports(
    node: ASTNode,
) -> list[str]:

    if node.node_type != "import_declaration":
        return []

    if not node.text:
        return []

    text = node.text.strip()

    if not text.startswith("import "):
        return []

    target = text[
        len("import "):
    ].strip()

    target = target.rstrip(";").strip()

    if target.startswith("static "):
        target = target[len("static "):].strip()

    return [target] if target else []


def _clean_import_target(
    target: str,
) -> str:

    target = target.strip()
    target = target.rstrip(";").strip()

    if (
        len(target) >= 2
        and target[0] in {"'", '"'}
        and target[-1] == target[0]
    ):
        target = target[1:-1]

    return target.strip()


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