from contextlib import contextmanager
from typing import Any, Generator

from neo4j import Driver, GraphDatabase


NEO4J_URI = "bolt://localhost:7687"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "reqforge123"


class Neo4jClient:
    """
    Handles Neo4j connectivity and Cypher execution.
    """

    def __init__(
        self,
        uri: str = NEO4J_URI,
        username: str = NEO4J_USERNAME,
        password: str = NEO4J_PASSWORD,
    ):
        self.driver: Driver = GraphDatabase.driver(
            uri,
            auth=(username, password),
        )

    def verify_connection(self) -> bool:
        """Check whether Neo4j is reachable."""

        try:
            self.driver.verify_connectivity()
            return True

        except Exception as exc:
            print(f"Neo4j connection failed: {exc}")
            return False

    def close(self) -> None:
        """Close the Neo4j driver."""

        self.driver.close()

    def execute(
        self,
        query: str,
        parameters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Execute a read/write Cypher query."""

        parameters = parameters or {}

        with self.driver.session() as session:
            result = session.run(
                query,
                parameters,
            )

            return [
                record.data()
                for record in result
            ]

    def execute_write(
        self,
        query: str,
        parameters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Execute a Cypher write transaction."""

        parameters = parameters or {}

        with self.driver.session() as session:
            return session.execute_write(
                self._write_transaction,
                query,
                parameters,
            )

    @staticmethod
    def _write_transaction(
        tx,
        query: str,
        parameters: dict[str, Any],
    ) -> list[dict[str, Any]]:

        result = tx.run(
            query,
            parameters,
        )

        return [
            record.data()
            for record in result
        ]


@contextmanager
def get_neo4j_client() -> Generator[Neo4jClient, None, None]:
    """Create and automatically close a Neo4j client."""

    client = Neo4jClient()

    try:
        yield client

    finally:
        client.close()