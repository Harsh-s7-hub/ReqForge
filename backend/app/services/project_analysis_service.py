from datetime import datetime, timezone

import hashlib
from pathlib import Path

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.analysis_file import AnalysisFile
from app.models.analysis_language_statistics import (
    AnalysisLanguageStatistics,
)
from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis

from app.services.github_repository_snapshot_service import (
    GitHubRepositorySnapshotService,
)

from ai_services.abstract_syntax_tree.analyzer.repository_analyzer import (
    analyze_repository,
)
from ai_services.abstract_syntax_tree.extractor.dependency_extractor import (
    extract_dependencies,
)
from ai_services.abstract_syntax_tree.extractor.symbol_extractor import (
    extract_symbols,
)
from ai_services.graph.graph_builder import (
    GraphBuilder,
    GraphFile,
)
from ai_services.graph.neo4j_client import Neo4jClient


class ProjectAnalysisService:
    """
    Coordinates a complete RegForge repository analysis.

    Pipeline:

        GitHub
          ↓
        Snapshot
          ↓
        Tree-sitter
          ↓
        Symbols + Dependencies
          ↓
        PostgreSQL metadata
          ↓
        Neo4j graph
    """

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

        self.snapshot_service = (
            GitHubRepositorySnapshotService()
        )

    def analyze_project(
        self,
        project: Project,
        repository,
        commit_sha: str,
        github_token: str,
        update_current: bool = True,
    ) -> ProjectAnalysis:

        analysis = self._create_analysis(
            project=project,
            commit_sha=commit_sha,
        )

        snapshot_root: Path | None = None
        neo4j_client: Neo4jClient | None = None

        try:
            analysis.status = "running"
            analysis.started_at = datetime.now(
                timezone.utc
            )

            self.db.commit()
            self.db.refresh(analysis)

            # --------------------------------------------------
            # 1. Download repository at exact commit
            # --------------------------------------------------

            owner, repository_name = (
                self._get_repository_identity(
                    repository
                )
            )

            snapshot_root = (
                self.snapshot_service.download_snapshot(
                    owner=owner,
                    repository=repository_name,
                    commit_sha=commit_sha,
                    access_token=github_token,
                )
            )

            # --------------------------------------------------
            # 2. Analyze repository with Tree-sitter
            # --------------------------------------------------

            result = analyze_repository(
                str(snapshot_root)
            )

            # --------------------------------------------------
            # 3. Store PostgreSQL analysis metadata
            # --------------------------------------------------

            self._store_analysis_files(
                analysis=analysis,
                analysis_result=result,
                snapshot_root=snapshot_root,
            )

            self._store_language_statistics(
                analysis=analysis,
                analysis_result=result,
                snapshot_root=snapshot_root,
            )

            analysis.files_scanned = (
                result["files_scanned"]
            )

            analysis.files_parsed = (
                result["files_parsed"]
            )

            analysis.unsupported_files = (
                result["unsupported_files"]
            )

            analysis.parse_errors = (
                result["parse_errors"]
            )

            # --------------------------------------------------
            # 4. Build Neo4j graph
            # --------------------------------------------------

            neo4j_client = Neo4jClient()

            if not neo4j_client.verify_connection():
                raise RuntimeError(
                    "Neo4j is not available."
                )

            graph_builder = GraphBuilder(
                neo4j_client
            )

            graph_builder.create_constraints()

            graph_builder.create_project(
                project_id=project.id,
                name=project.name,
            )

            graph_builder.create_analysis(
                project_id=project.id,
                analysis_id=analysis.id,
                commit_sha=commit_sha,
                analysis_number=analysis.analysis_number,
            )

            self._build_graph(
                graph_builder=graph_builder,
                analysis_result=result,
                snapshot_root=snapshot_root,
                project_id=project.id,
                analysis_id=analysis.id,
            )

            # --------------------------------------------------
            # 5. Mark analysis completed
            # --------------------------------------------------

            analysis.status = "completed"
            analysis.completed_at = datetime.now(
                timezone.utc
            )

            # Only the latest/current analysis should update
            # projects.current_analysis_id.
            #
            # Historical commit analysis must remain available
            # through its own analysis record without replacing
            # the project's current analysis.
            if update_current:
                project.current_analysis_id = analysis.id

            self.db.commit()

            # Refresh both ORM objects so their state reflects
            # the committed database state.
            self.db.refresh(analysis)
            self.db.refresh(project)

            return analysis

        except Exception as exc:

            self.db.rollback()

            # The analysis object was already persisted by
            # _create_analysis(), so restore its failed state.
            analysis.status = "failed"

            self.db.add(analysis)

            self.db.commit()

            raise RuntimeError(
                f"Project analysis failed: {exc}"
            ) from exc

        finally:

            if neo4j_client is not None:
                neo4j_client.close()

            if snapshot_root is not None:

                snapshot_directory = (
                    snapshot_root.parent.parent
                )

                self.snapshot_service.cleanup_snapshot(
                    snapshot_directory
                )

    # ==========================================================
    # PostgreSQL
    # ==========================================================

    def _create_analysis(
        self,
        project: Project,
        commit_sha: str,
    ) -> ProjectAnalysis:

        latest_number = (
            self.db.query(
                func.max(
                    ProjectAnalysis.analysis_number
                )
            )
            .filter(
                ProjectAnalysis.project_id
                == project.id
            )
            .scalar()
        )

        analysis_number = (
            (latest_number or 0) + 1
        )

        parent_analysis_id = (
            project.current_analysis_id
        )

        analysis = ProjectAnalysis(
            project_id=project.id,
            commit_sha=commit_sha,
            parent_analysis_id=parent_analysis_id,
            analysis_number=analysis_number,
            status="pending",
        )

        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)

        return analysis

    def _store_analysis_files(
        self,
        analysis: ProjectAnalysis,
        analysis_result: dict,
        snapshot_root: Path,
    ) -> None:

        for file_ast in analysis_result["files"]:

            file_path = Path(file_ast.path)

            relative_path = file_path.relative_to(
                snapshot_root
            ).as_posix()

            full_path = snapshot_root / relative_path

            file_size = full_path.stat().st_size

            line_count = (
                self._count_lines(full_path)
            )

            file_hash = (
                self._calculate_hash(full_path)
            )

            parse_status = (
                "failed"
                if file_ast.parse_error
                else "parsed"
            )

            db_file = AnalysisFile(
                analysis_id=analysis.id,
                file_path=relative_path,
                language=file_ast.language,
                file_hash=file_hash,
                lines=line_count,
                bytes=file_size,
                parse_status=parse_status,
            )

            self.db.add(db_file)

        self.db.flush()

    def _store_language_statistics(
        self,
        analysis: ProjectAnalysis,
        analysis_result: dict,
        snapshot_root: Path,
    ) -> None:

        language_data: dict[str, dict] = {}

        for file_ast in analysis_result["files"]:

            language = file_ast.language

            if language not in language_data:
                language_data[language] = {
                    "files": 0,
                    "parsed_files": 0,
                    "parse_errors": 0,
                    "lines": 0,
                    "bytes": 0,
                }

            stats = language_data[language]

            full_path = Path(file_ast.path)

            stats["files"] += 1

            if not file_ast.parse_error:
                stats["parsed_files"] += 1
            else:
                stats["parse_errors"] += 1

            try:
                stats["lines"] += (
                    self._count_lines(full_path)
                )

                stats["bytes"] += (
                    full_path.stat().st_size
                )

            except OSError:
                pass

        for language, stats in language_data.items():

            db_stats = AnalysisLanguageStatistics(
                analysis_id=analysis.id,
                language=language,
                files=stats["files"],
                parsed_files=stats["parsed_files"],
                parse_errors=stats["parse_errors"],
                lines=stats["lines"],
                bytes=stats["bytes"],
            )

            self.db.add(db_stats)

        self.db.flush()

    # ==========================================================
    # Neo4j
    # ==========================================================

    def _build_graph(
        self,
        graph_builder: GraphBuilder,
        analysis_result: dict,
        snapshot_root: Path,
        project_id: int,
        analysis_id: int,
    ) -> None:

        for file_ast in analysis_result["files"]:

            absolute_path = Path(
                file_ast.path
            )

            relative_path = (
                absolute_path
                .relative_to(snapshot_root)
                .as_posix()
            )

            # Normalize the AST path so Neo4j stores
            # repository-relative paths.
            file_ast.path = relative_path

            symbols = extract_symbols(
                file_ast
            )

            dependencies = extract_dependencies(
                file_ast
            )

            # Normalize dependency source path.
            for dependency in dependencies:
                dependency.source_file = (
                    relative_path
                )

            graph_file = GraphFile(
                path=relative_path,
                language=file_ast.language,
                symbols=symbols,
                dependencies=dependencies,
            )

            graph_builder.create_file(
                project_id=project_id,
                analysis_id=analysis_id,
                file=graph_file,
            )

            for symbol in symbols:

                graph_builder.create_symbol(
                    project_id=project_id,
                    analysis_id=analysis_id,
                    file_path=relative_path,
                    symbol=symbol,
                )

                if symbol.parent_name:
                    graph_builder.create_method_relationship(
                        project_id=project_id,
                        analysis_id=analysis_id,
                        file_path=relative_path,
                        symbol=symbol,
                    )

            for dependency in dependencies:

                graph_builder.create_dependency(
                    project_id=project_id,
                    analysis_id=analysis_id,
                    dependency=dependency,
                )

    # ==========================================================
    # Helpers
    # ==========================================================

    @staticmethod
    def _get_repository_identity(
        repository,
    ) -> tuple[str, str]:

        full_name = getattr(
            repository,
            "full_name",
            None,
        )

        if not full_name:
            raise ValueError(
                "GitHub repository full_name is required."
            )

        parts = full_name.split("/", 1)

        if len(parts) != 2:
            raise ValueError(
                f"Invalid GitHub repository name: "
                f"{full_name}"
            )

        return parts[0], parts[1]

    @staticmethod
    def _count_lines(
        file_path: Path,
    ) -> int:

        try:
            with file_path.open(
                "rb"
            ) as file:

                return sum(
                    1
                    for _ in file
                )

        except OSError:
            return 0

    @staticmethod
    def _calculate_hash(
        file_path: Path,
    ) -> str:

        sha256 = hashlib.sha256()

        with file_path.open("rb") as file:

            while chunk := file.read(
                1024 * 1024
            ):
                sha256.update(chunk)

        return sha256.hexdigest()