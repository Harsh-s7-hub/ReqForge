
from sqlalchemy.orm import Session

from app.models.github_installation import GitHubInstallation
from app.models.github_repositories import GitHubRepository


def sync_github_repositories(db: Session, payload: dict) -> str:
    installation_data = payload.get("installation") or {}
    external_installation_id = installation_data.get("id")

    if not external_installation_id:
        raise ValueError("Missing GitHub installation ID.")

    # Find the installation using GitHub's external installation ID.
    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.installation_id
            == external_installation_id
        )
        .first()
    )

    if not installation:
        raise ValueError("Installation is not registered in RegForge.")

    action = payload.get("action")

    # Handle repositories added to an installation.
    if action == "added":
        repositories = payload.get("repositories_added") or []

        for repo in repositories:
            repo_id = repo.get("id")
            owner = repo.get("owner") or {}

            name = repo.get("name")
            full_name = repo.get("full_name")
            owner_login = owner.get("login")
            html_url = repo.get("html_url")

            if not all([
                repo_id,
                name,
                full_name,
                owner_login,
                html_url,
            ]):
                raise ValueError("Incomplete repository information.")

            existing_repo = (
                db.query(GitHubRepository)
                .filter(
                    GitHubRepository.github_repo_id == repo_id
                )
                .first()
            )

            # Prevent silently linking a repository to another installation.
            if (
                existing_repo
                and existing_repo.github_installation_id
                != installation.id
            ):
                raise ValueError(
                    "Repository is already linked to another installation."
                )

            if existing_repo:
                existing_repo.name = name
                existing_repo.full_name = full_name
                existing_repo.owner_login = owner_login
                existing_repo.is_private = repo.get("private", False)
                existing_repo.html_url = html_url
                existing_repo.default_branch = repo.get("default_branch")
                existing_repo.is_active = True

            else:
                new_repo = GitHubRepository(
                    github_repo_id=repo_id,
                    github_installation_id=installation.id,
                    name=name,
                    full_name=full_name,
                    owner_login=owner_login,
                    is_private=repo.get("private", False),
                    html_url=html_url,
                    default_branch=repo.get("default_branch"),
                    is_active=True,
                )

                db.add(new_repo)

        db.commit()
        return f"Successfully synchronized {len(repositories)} added repositories."

    # Handle repositories removed from an installation.
    elif action == "removed":
        repositories = payload.get("repositories_removed") or []

        for repo in repositories:
            repo_id = repo.get("id")

            if not repo_id:
                continue

            existing_repo = (
                db.query(GitHubRepository)
                .filter(
                    GitHubRepository.github_repo_id == repo_id,
                    GitHubRepository.github_installation_id == installation.id,
                )
                .first()
            )

            if existing_repo:
                existing_repo.is_active = False

        db.commit()
        return f"Successfully deactivated {len(repositories)} removed repositories."

    return f"Repository event ignored: {action}"
