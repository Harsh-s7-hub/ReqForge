from dataclasses import dataclass

from ai_services.abstract_syntax_tree.extractor.dependency_extractor import (
    Dependency,
)
from ai_services.abstract_syntax_tree.extractor.symbol_extractor import (
    Symbol,
)
from ai_services.graph.neo4j_client import Neo4jClient


@dataclass
class GraphFile:
    """
    Represents a source file and the symbols/dependencies
    extracted from it.
    """

    path: str
    language: str
    symbols: list[Symbol]
    dependencies: list[Dependency]


class GraphBuilder:
    """
    Builds the versioned RegForge source/AST graph in Neo4j.
    """

    def __init__(self, client: Neo4jClient):
        self.client = client

    # ==========================================================
    # Constraints
    # ==========================================================

    def create_constraints(self) -> None:
        """
        Create uniqueness constraints required by RegForge.
        """

        queries = [
            """
            CREATE CONSTRAINT project_unique IF NOT EXISTS
            FOR (p:Project)
            REQUIRE (p.project_id) IS UNIQUE
            """,
            """
            CREATE CONSTRAINT analysis_unique IF NOT EXISTS
            FOR (a:Analysis)
            REQUIRE (a.analysis_id) IS UNIQUE
            """,
            """
            CREATE CONSTRAINT file_unique IF NOT EXISTS
            FOR (f:File)
            REQUIRE (f.node_id) IS UNIQUE
            """,
            """
            CREATE CONSTRAINT class_unique IF NOT EXISTS
            FOR (c:Class)
            REQUIRE (c.node_id) IS UNIQUE
            """,
            """
            CREATE CONSTRAINT function_unique IF NOT EXISTS
            FOR (f:Function)
            REQUIRE (f.node_id) IS UNIQUE
            """,
        ]

        for query in queries:
            self.client.execute_write(query)

    # ==========================================================
    # Project
    # ==========================================================

    def create_project(
        self,
        project_id: int,
        name: str,
    ) -> None:
        """
        Create or update the project node.
        """

        query = """
        MERGE (p:Project {
            project_id: $project_id
        })

        SET p.name = $name
        """

        self.client.execute_write(
            query,
            {
                "project_id": project_id,
                "name": name,
            },
        )

    # ==========================================================
    # Analysis
    # ==========================================================

    def create_analysis(
        self,
        project_id: int,
        analysis_id: int,
        commit_sha: str,
        analysis_number: int,
    ) -> None:
        """
        Create the analysis node and connect it to its project.
        """

        query = """
        MATCH (p:Project {
            project_id: $project_id
        })

        MERGE (a:Analysis {
            analysis_id: $analysis_id
        })

        SET
            a.project_id = $project_id,
            a.commit_sha = $commit_sha,
            a.analysis_number = $analysis_number

        MERGE (p)-[:HAS_ANALYSIS]->(a)
        """

        self.client.execute_write(
            query,
            {
                "project_id": project_id,
                "analysis_id": analysis_id,
                "commit_sha": commit_sha,
                "analysis_number": analysis_number,
            },
        )

    # ==========================================================
    # Files
    # ==========================================================

    def create_file(
        self,
        project_id: int,
        analysis_id: int,
        file: GraphFile,
    ) -> None:
        """
        Create a file node and connect it to the analysis.
        """

        node_id = self._file_node_id(
            project_id,
            analysis_id,
            file.path,
        )

        query = """
        MATCH (a:Analysis {
            analysis_id: $analysis_id
        })

        MERGE (f:File {
            node_id: $node_id
        })

        SET
            f.project_id = $project_id,
            f.analysis_id = $analysis_id,
            f.path = $path,
            f.language = $language,
            f.name = $name

        MERGE (a)-[:CONTAINS]->(f)
        """

        self.client.execute_write(
            query,
            {
                "node_id": node_id,
                "project_id": project_id,
                "analysis_id": analysis_id,
                "path": file.path,
                "language": file.language,
                "name": file.path.rsplit("/", 1)[-1],
            },
        )

    # ==========================================================
    # Symbols
    # ==========================================================

    def create_symbol(
        self,
        project_id: int,
        analysis_id: int,
        file_path: str,
        symbol: Symbol,
    ) -> None:
        """
        Create a Class/Function node and connect it to its
        defining file.
        """

        symbol_type = (
            "Class"
            if symbol.symbol_type == "class"
            else "Function"
        )

        node_id = self._symbol_node_id(
            project_id,
            analysis_id,
            file_path,
            symbol,
        )

        relationship_type = (
            "DEFINES_CLASS"
            if symbol_type == "Class"
            else "DEFINES_FUNCTION"
        )

        query = f"""
        MATCH (file:File {{
            node_id: $file_node_id
        }})

        MERGE (symbol:{symbol_type} {{
            node_id: $node_id
        }})

        SET
            symbol.project_id = $project_id,
            symbol.analysis_id = $analysis_id,
            symbol.name = $name,
            symbol.file_path = $file_path,
            symbol.start_line = $start_line,
            symbol.end_line = $end_line,
            symbol.symbol_type = $symbol_type

        MERGE (file)-[:{relationship_type}]->(symbol)
        """

        self.client.execute_write(
            query,
            {
                "file_node_id": self._file_node_id(
                    project_id,
                    analysis_id,
                    file_path,
                ),
                "node_id": node_id,
                "project_id": project_id,
                "analysis_id": analysis_id,
                "name": symbol.name,
                "file_path": file_path,
                "start_line": symbol.start_line,
                "end_line": symbol.end_line,
                "symbol_type": symbol.symbol_type,
            },
        )

    # ==========================================================
    # Class -> Method
    # ==========================================================

    def create_method_relationship(
        self,
        project_id: int,
        analysis_id: int,
        file_path: str,
        symbol: Symbol,
    ) -> None:
        """
        Connect a method to its parent class.
        """

        if not symbol.parent_name:
            return

        method_node_id = self._symbol_node_id(
            project_id,
            analysis_id,
            file_path,
            symbol,
        )

        class_node_id = (
            f"class:"
            f"{project_id}:"
            f"{analysis_id}:"
            f"{file_path}:"
            f"{symbol.parent_name}"
        )

        query = """
        MATCH (class:Class {
            node_id: $class_node_id
        })

        MATCH (method:Function {
            node_id: $method_node_id
        })

        MERGE (class)-[:DEFINES_FUNCTION]->(method)
        """

        self.client.execute_write(
            query,
            {
                "class_node_id": class_node_id,
                "method_node_id": method_node_id,
            },
        )

    # ==========================================================
    # File Dependencies
    # ==========================================================

    def create_dependency(
        self,
        project_id: int,
        analysis_id: int,
        dependency: Dependency,
    ) -> None:
        """
        Create an IMPORTS relationship between two files.

        The dependency target is resolved against repository-relative
        file paths already stored in Neo4j.
        """

        source_path = (
            dependency.source_file
            .replace("\\", "/")
            .strip("/")
        )

        target = (
            dependency.target
            .replace("\\", "/")
            .strip()
        )

        if not source_path or not target:
            return

        source_node_id = self._file_node_id(
            project_id,
            analysis_id,
            source_path,
        )

        candidate_paths = self._dependency_candidates(
            source_path=source_path,
            target=target,
        )

        if not candidate_paths:
            return

        query = """
        MATCH (source:File {
            node_id: $source_node_id
        })

        MATCH (target:File)
        WHERE
            target.project_id = $project_id
            AND target.analysis_id = $analysis_id
            AND target.path IN $candidate_paths

        MERGE (source)-[:IMPORTS]->(target)
        """

        self.client.execute_write(
            query,
            {
                "source_node_id": source_node_id,
                "project_id": project_id,
                "analysis_id": analysis_id,
                "candidate_paths": candidate_paths,
            },
        )

    @staticmethod
    def _dependency_candidates(
        source_path: str,
        target: str,
    ) -> list[str]:
        """
        Generate repository-relative candidate paths for an import.

        Supports:

        Python:
            import services.auth
            from services.auth import login
            from .auth import login
            from ..services import auth

        JavaScript:
            import auth from "./auth"
            import { User } from "./models/user"

        TypeScript:
            import auth from "./auth"
            import { User } from "./models/user"

        Also supports:

            .py
            .js
            .jsx
            .ts
            .tsx
            .java
            index files
            __init__.py packages
        """

        target = target.strip().replace("\\", "/")

        if not target:
            return []

        source = source_path.replace("\\", "/")

        source_dir = (
            source.rsplit("/", 1)[0]
            if "/" in source
            else ""
        )

        candidates: list[str] = []

        def add(path: str) -> None:
            path = path.replace("\\", "/").strip()

            while path.startswith("./"):
                path = path[2:]

            path = path.lstrip("/")

            if path and path not in candidates:
                candidates.append(path)

        # ------------------------------------------------------
        # Normalize target
        # ------------------------------------------------------

        normalized = target

        # Remove surrounding quotes.
        if (
            len(normalized) >= 2
            and normalized[0] in {"'", '"'}
            and normalized[-1] == normalized[0]
        ):
            normalized = normalized[1:-1]

        normalized = normalized.strip()

        # ------------------------------------------------------
        # Relative imports
        # ------------------------------------------------------

        if normalized.startswith("."):
            relative = normalized

            dot_count = 0

            while relative.startswith("."):
                dot_count += 1
                relative = relative[1:]

            relative = relative.lstrip("/")

            base_parts = (
                source_dir.split("/")
                if source_dir
                else []
            )

            # "." means current directory.
            #
            # ".." means one directory up.
            #
            # "..." means two directories up.
            levels_up = max(dot_count - 1, 0)

            if levels_up:
                if levels_up <= len(base_parts):
                    base_parts = base_parts[
                        :-levels_up
                    ]
                else:
                    base_parts = []

            if relative:
                relative_path = "/".join(
                    [
                        *base_parts,
                        relative,
                    ]
                )
            else:
                relative_path = "/".join(
                    base_parts
                )

            add(relative_path)

        else:
            add(normalized)

        # ------------------------------------------------------
        # Python dotted module
        #
        # services.auth
        #
        # becomes:
        #
        # services/auth
        # ------------------------------------------------------

        if not normalized.startswith("."):
            dotted = normalized.replace(
                ".",
                "/",
            )

            add(dotted)

        # ------------------------------------------------------
        # Generate file candidates
        # ------------------------------------------------------

        base_candidates = list(candidates)

        extensions = [
            ".py",
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".java",
        ]

        for base in base_candidates:

            # Exact path.
            add(base)

            # File extensions.
            for extension in extensions:
                if not base.endswith(extension):
                    add(
                        f"{base}{extension}"
                    )

            # JavaScript / TypeScript index files.
            add(
                f"{base}/index.js"
            )
            add(
                f"{base}/index.jsx"
            )
            add(
                f"{base}/index.ts"
            )
            add(
                f"{base}/index.tsx"
            )

            # Python package.
            add(
                f"{base}/__init__.py"
            )

        return candidates

    # ==========================================================
    # Clear Analysis
    # ==========================================================

    def clear_analysis(
        self,
        analysis_id: int,
    ) -> None:
        """
        Delete all graph data belonging to one analysis.

        Used if an analysis needs to be rebuilt.
        """

        query = """
        MATCH (n)
        WHERE n.analysis_id = $analysis_id
        DETACH DELETE n
        """

        self.client.execute_write(
            query,
            {
                "analysis_id": analysis_id,
            },
        )

    # ==========================================================
    # ID Helpers
    # ==========================================================

    @staticmethod
    def _file_node_id(
        project_id: int,
        analysis_id: int,
        file_path: str,
    ) -> str:
        return (
            f"file:"
            f"{project_id}:"
            f"{analysis_id}:"
            f"{file_path}"
        )

    @staticmethod
    def _symbol_node_id(
        project_id: int,
        analysis_id: int,
        file_path: str,
        symbol: Symbol,
    ) -> str:
        return (
            f"{symbol.symbol_type}:"
            f"{project_id}:"
            f"{analysis_id}:"
            f"{file_path}:"
            f"{symbol.name}:"
            f"{symbol.start_line}"
        )