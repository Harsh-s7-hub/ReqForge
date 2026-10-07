from typing import Any

import httpx


GITHUB_API_URL = "https://api.github.com"


class GitHubCommitService:
    """
    Fetches commit history from GitHub for a repository.
    """

    def get_commits(
        self,
        owner: str,
        repository: str,
        access_token: str,
        per_page: int = 20,
    ) -> list[dict[str, Any]]:
        """
        Return recent commits for a GitHub repository.
        """

        if not owner or not repository:
            raise ValueError(
                "GitHub owner and repository are required."
            )

        if not access_token:
            raise ValueError(
                "GitHub access token is required."
            )

        url = (
            f"{GITHUB_API_URL}/repos/"
            f"{owner}/{repository}/commits"
        )

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "RegForge",
        }

        params = {
            "per_page": min(per_page, 100),
        }

        try:
            response = httpx.get(
                url,
                headers=headers,
                params=params,
                timeout=30.0,
            )

            response.raise_for_status()

        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code

            if status == 401:
                raise RuntimeError(
                    "GitHub authentication failed."
                ) from exc

            if status == 403:
                raise RuntimeError(
                    "GitHub access denied."
                ) from exc

            if status == 404:
                raise RuntimeError(
                    "GitHub repository not found."
                ) from exc

            raise RuntimeError(
                f"GitHub commits request failed "
                f"with HTTP {status}."
            ) from exc

        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"GitHub commits request failed: {exc}"
            ) from exc

        data = response.json()

        return [
            self._normalize_commit(commit)
            for commit in data
        ]

    @staticmethod
    def _normalize_commit(
        commit: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Convert GitHub's commit response into
        the structure used by RegForge.
        """

        commit_data = (
            commit.get("commit")
            or {}
        )

        author_data = (
            commit_data.get("author")
            or {}
        )

        committer_data = (
            commit_data.get("committer")
            or {}
        )

        github_author = (
            commit.get("author")
            or {}
        )

        github_committer = (
            commit.get("committer")
            or {}
        )

        # Prefer the GitHub account login because
        # it is the actual GitHub user identity.
        author = (
            github_author.get("login")
            or github_author.get("name")
            or github_committer.get("login")
            or github_committer.get("name")
            or author_data.get("name")
            or committer_data.get("name")
            or "Unknown author"
        )

        # GitHub account avatar.
        avatar_url = (
            github_author.get("avatar_url")
            or github_committer.get("avatar_url")
        )

        # Prefer the author timestamp.
        created_at = (
            author_data.get("date")
            or committer_data.get("date")
            or ""
        )

        return {
            "sha": commit.get("sha"),
            "message": (
                commit_data.get(
                    "message",
                    "",
                ).split("\n")[0]
            ),
            "author": author,
            "avatar_url": avatar_url,
            "created_at": created_at,
            "html_url": commit.get("html_url"),
        }