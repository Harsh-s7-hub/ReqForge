from ai_services.abstract_syntax_tree.extractor.dependency_extractor import (
    extract_dependencies,
)
from ai_services.abstract_syntax_tree.extractor.symbol_extractor import (
    extract_symbols,
)
from ai_services.abstract_syntax_tree.parser.language_parser import (
    parse_file,
)
from ai_services.graph.graph_builder import (
    GraphBuilder,
    GraphFile,
)
from ai_services.graph.neo4j_client import Neo4jClient


PROJECT_ID = 999999
ANALYSIS_ID = 999999
COMMIT_SHA = "local-test-commit"
ANALYSIS_NUMBER = 1

SAMPLE_FILE = (
    "ai_services/abstract_syntax_tree/sample.py"
)


def main():
    print("\n========== REGFORGE GRAPH TEST ==========\n")

    # --------------------------------------------------
    # 1. Parse source file
    # --------------------------------------------------

    file_ast = parse_file(SAMPLE_FILE)

    if file_ast is None:
        raise RuntimeError(
            f"Could not parse {SAMPLE_FILE}"
        )

    print(f"File: {file_ast.path}")
    print(f"Language: {file_ast.language}")
    print(f"Parse error: {file_ast.parse_error}")

    # --------------------------------------------------
    # 2. Extract symbols
    # --------------------------------------------------

    symbols = extract_symbols(file_ast)

    print("\nSymbols:")

    for symbol in symbols:
        print(
            f"  {symbol.symbol_type:10} "
            f"{symbol.name}"
        )

    # --------------------------------------------------
    # 3. Extract dependencies
    # --------------------------------------------------

    dependencies = extract_dependencies(file_ast)

    print("\nDependencies:")

    for dependency in dependencies:
        print(
            f"  {dependency.dependency_type:10} "
            f"{dependency.target}"
        )

    # --------------------------------------------------
    # 4. Build graph data
    # --------------------------------------------------

    graph_file = GraphFile(
        path=SAMPLE_FILE,
        language=file_ast.language,
        symbols=symbols,
        dependencies=dependencies,
    )

    # --------------------------------------------------
    # 5. Connect Neo4j
    # --------------------------------------------------

    client = Neo4jClient()

    if not client.verify_connection():
        raise RuntimeError(
            "Neo4j connection failed."
        )

    builder = GraphBuilder(client)

    try:

        # --------------------------------------------------
        # 6. Create constraints
        # --------------------------------------------------

        print("\nCreating constraints...")

        builder.create_constraints()

        # --------------------------------------------------
        # 7. Create project
        # --------------------------------------------------

        print("Creating project...")

        builder.create_project(
            project_id=PROJECT_ID,
            name="RegForge Graph Test",
        )

        # --------------------------------------------------
        # 8. Create analysis
        # --------------------------------------------------

        print("Creating analysis...")

        builder.create_analysis(
            project_id=PROJECT_ID,
            analysis_id=ANALYSIS_ID,
            commit_sha=COMMIT_SHA,
            analysis_number=ANALYSIS_NUMBER,
        )

        # --------------------------------------------------
        # 9. Create file
        # --------------------------------------------------

        print("Creating file...")

        builder.create_file(
            project_id=PROJECT_ID,
            analysis_id=ANALYSIS_ID,
            file=graph_file,
        )

        # --------------------------------------------------
        # 10. Create symbols
        # --------------------------------------------------

        print("Creating symbols...")

        for symbol in symbols:

            builder.create_symbol(
                project_id=PROJECT_ID,
                analysis_id=ANALYSIS_ID,
                file_path=SAMPLE_FILE,
                symbol=symbol,
            )

            if symbol.parent_name:
                builder.create_method_relationship(
                    project_id=PROJECT_ID,
                    analysis_id=ANALYSIS_ID,
                    file_path=SAMPLE_FILE,
                    symbol=symbol,
                )

        # --------------------------------------------------
        # 11. Create dependencies
        # --------------------------------------------------

        print("Creating dependencies...")

        for dependency in dependencies:

            builder.create_dependency(
                project_id=PROJECT_ID,
                analysis_id=ANALYSIS_ID,
                dependency=dependency,
            )

        print("\nGraph successfully written to Neo4j.")

        # --------------------------------------------------
        # 12. Query graph
        # --------------------------------------------------

        result = client.execute(
            """
            MATCH (n)
            WHERE n.project_id = $project_id
            RETURN
                labels(n) AS labels,
                n.name AS name,
                n.path AS path,
                n.commit_sha AS commit_sha
            ORDER BY labels(n)
            """,
            {
                "project_id": PROJECT_ID,
            },
        )

        print("\n========== GRAPH NODES ==========\n")

        for row in result:
            print(row)

        # --------------------------------------------------
        # 13. Query relationships
        # --------------------------------------------------

        relationships = client.execute(
            """
            MATCH (a)-[r]->(b)
            WHERE
                a.project_id = $project_id
                AND b.project_id = $project_id

            RETURN
                labels(a) AS source_type,
                coalesce(a.name, a.path) AS source,
                type(r) AS relationship,
                labels(b) AS target_type,
                coalesce(b.name, b.path) AS target

            ORDER BY relationship
            """,
            {
                "project_id": PROJECT_ID,
            },
        )

        print("\n========== GRAPH RELATIONSHIPS ==========\n")

        for row in relationships:
            print(row)

    finally:
        client.close()


if __name__ == "__main__":
    main()