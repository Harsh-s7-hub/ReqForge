
import asyncio
import traceback

from app.supabase_db.session import SessionLocal
from app.services.github_code_indexing_service import (
    index_github_repository,
)


async def main():
    # Replace with the internal ID of an active test repository.
    repository_db_id = 26

    db = SessionLocal()

    try:
        result = await index_github_repository(
            db=db,
            repository_db_id=repository_db_id,
        )

        print("\nGitHub repository indexing completed:")
        for key, value in result.items():
            print(f"{key}: {value}")

    except Exception:
        traceback.print_exc()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
