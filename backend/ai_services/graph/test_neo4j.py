from ai_services.graph.neo4j_client import Neo4jClient


def main():
    client = Neo4jClient()

    try:
        connected = client.verify_connection()

        print(f"Neo4j connected: {connected}")

        if connected:
            result = client.execute(
                "RETURN 'RegForge Neo4j is working' AS message"
            )

            print(result)

    finally:
        client.close()


if __name__ == "__main__":
    main()