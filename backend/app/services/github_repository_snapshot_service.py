from pathlib import Path
import shutil
import tarfile
import tempfile

import httpx


GITHUB_API_URL = "https://api.github.com"


class GitHubRepositorySnapshotService:
    """
    Downloads a GitHub repository at an exact commit SHA
    and extracts it into a temporary directory.

    The returned directory represents the repository state
    at that specific commit.
    """

    def __init__(self):
        self.api_url = GITHUB_API_URL

    def download_snapshot(
        self,
        owner: str,
        repository: str,
        commit_sha: str,
        access_token: str,
    ) -> Path:
        """
        Download and extract a repository at an exact commit.

        Returns:
            Path to the extracted repository directory.
        """

        if not owner:
            raise ValueError("GitHub owner is required.")

        if not repository:
            raise ValueError(
                "GitHub repository name is required."
            )

        if not commit_sha:
            raise ValueError(
                "Commit SHA is required."
            )

        if not access_token:
            raise ValueError(
                "GitHub access token is required."
            )

        snapshot_dir = Path(
            tempfile.mkdtemp(
                prefix="reqforge_snapshot_"
            )
        )

        archive_path = snapshot_dir / "repository.tar.gz"

        download_url = (
            f"{self.api_url}/repos/"
            f"{owner}/{repository}/tarball/"
            f"{commit_sha}"
        )

        headers = {
            "Authorization": (
                f"Bearer {access_token}"
            ),
            "Accept": (
                "application/vnd.github+json"
            ),
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "RegForge",
        }

        try:
            self._download_archive(
                download_url=download_url,
                headers=headers,
                archive_path=archive_path,
            )

            repository_path = (
                snapshot_dir / "repository"
            )

            repository_path.mkdir(
                parents=True,
                exist_ok=True,
            )

            self._extract_archive(
                archive_path=archive_path,
                destination=repository_path,
            )

            # GitHub tarballs normally contain one
            # top-level directory such as:
            #
            # owner-repository-abc123/
            #
            # We return that directory directly.
            extracted_directories = [
                path
                for path in repository_path.iterdir()
                if path.is_dir()
            ]

            if len(extracted_directories) == 1:
                return extracted_directories[0]

            return repository_path

        except Exception:
            self.cleanup_snapshot(snapshot_dir)
            raise

    def _download_archive(
        self,
        download_url: str,
        headers: dict[str, str],
        archive_path: Path,
    ) -> None:
        """
        Download the GitHub repository archive.
        """

        try:
            with httpx.stream(
                "GET",
                download_url,
                headers=headers,
                follow_redirects=True,
                timeout=120.0,
            ) as response:

                response.raise_for_status()

                with archive_path.open("wb") as file:

                    for chunk in response.iter_bytes(
                        chunk_size=1024 * 1024
                    ):
                        if chunk:
                            file.write(chunk)

        except httpx.HTTPStatusError as exc:

            status_code = exc.response.status_code

            if status_code == 401:
                raise RuntimeError(
                    "GitHub authentication failed. "
                    "Check the installation token."
                ) from exc

            if status_code == 403:
                raise RuntimeError(
                    "GitHub access denied. "
                    "Check repository permissions."
                ) from exc

            if status_code == 404:
                raise RuntimeError(
                    "GitHub repository or commit was "
                    "not found."
                ) from exc

            raise RuntimeError(
                f"GitHub snapshot download failed "
                f"with HTTP {status_code}."
            ) from exc

        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"GitHub snapshot request failed: {exc}"
            ) from exc

    @staticmethod
    def _extract_archive(
        archive_path: Path,
        destination: Path,
    ) -> None:
        """
        Safely extract the downloaded tar archive.
        """

        try:
            with tarfile.open(
                archive_path,
                mode="r:gz",
            ) as archive:

                archive.extractall(
                    destination,
                    filter="data",
                )

        except (tarfile.TarError, OSError) as exc:
            raise RuntimeError(
                f"Failed to extract GitHub snapshot: {exc}"
            ) from exc

    @staticmethod
    def cleanup_snapshot(
        snapshot_directory: Path,
    ) -> None:
        """
        Delete a temporary repository snapshot.
        """

        if snapshot_directory.exists():
            shutil.rmtree(
                snapshot_directory,
                ignore_errors=True,
            )