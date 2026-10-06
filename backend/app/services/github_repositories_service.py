from sqlalchemy.orm import Session

from app.models.github_installation import GitHubInstallation
from app.models.github_repositories import GitHubRepository


def sync_github_repositories(
    db: Session,
    payload: dict,
) -> str:
    installation_data = payload.get("installation") or {}

    external_installation_id = installation_data.get("id")

    if not external_installation_id:
        raise ValueError(
            "GitHub installation ID is required."
        )

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.installation_id
            == external_installation_id
        )
        .first()
    )

    if not installation:
        raise ValueError(
            "GitHub installation was not found."
        )

    action = payload.get("action")

    if action == "added":
        repositories = (
            payload.get("repositories_added") or []
        )

        for repo in repositories:
            repo_id = repo.get("id")

            owner = repo.get("owner") or {}

            name = repo.get("name")
            full_name = repo.get("full_name")
            owner_login = owner.get("login")
            html_url = repo.get("html_url")

            if not all(
                [
                    repo_id,
                    name,
                    full_name,
                    owner_login,
                    html_url,
                ]
            ):
                continue

            existing_repo = (
                db.query(GitHubRepository)
                .filter(
                    GitHubRepository.github_repo_id
                    == repo_id
                )
                .first()
            )

            if existing_repo:
                if (
                    existing_repo.github_installation_id
                    != installation.id
                ):
                    raise ValueError(
                        "Repository belongs to another GitHub installation."
                    )

                existing_repo.name = name
                existing_repo.full_name = full_name
                existing_repo.owner_login = owner_login
                existing_repo.is_private = repo.get(
                    "private",
                    False,
                )
                existing_repo.html_url = html_url
                existing_repo.default_branch = repo.get(
                    "default_branch"
                )

                # Important:
                # If the repository was previously removed,
                # adding it again should reactivate it.
                existing_repo.is_active = True

            else:
                db.add(
                    GitHubRepository(
                        github_repo_id=repo_id,
                        github_installation_id=installation.id,
                        name=name,
                        full_name=full_name,
                        owner_login=owner_login,
                        is_private=repo.get(
                            "private",
                            False,
                        ),
                        html_url=html_url,
                        default_branch=repo.get(
                            "default_branch"
                        ),
                        is_active=True,
                    )
                )

        db.commit()

        return (
            f"Successfully synchronized "
            f"{len(repositories)} added repositories."
        )

    if action == "removed":
        repositories = (
            payload.get("repositories_removed") or []
        )

        for repo in repositories:
            repo_id = repo.get("id")

            if not repo_id:
                continue

            existing_repo = (
                db.query(GitHubRepository)
                .filter(
                    GitHubRepository.github_repo_id
                    == repo_id,
                    GitHubRepository.github_installation_id
                    == installation.id,
                )
                .first()
            )

            if existing_repo:
                existing_repo.is_active = False

        db.commit()

        return (
            f"Successfully deactivated "
            f"{len(repositories)} removed repositories."
        )

    return f"Repository event ignored: {action}"


def reconcile_github_repositories(
    db: Session,
    installation_id: int,
    repositories: list[dict],
) -> str:
    """
    Reconcile the complete repository list returned by GitHub
    with the repositories stored in RegForge.

    GitHub is treated as the source of truth.
    """

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.installation_id
            == installation_id,
        )
        .first()
    )

    if not installation:
        raise ValueError(
            "GitHub installation was not found."
        )

    # IDs currently accessible through GitHub.
    github_repository_ids: set[int] = set()

    for repo in repositories:
        repo_id = repo.get("id")

        owner = repo.get("owner") or {}

        name = repo.get("name")
        full_name = repo.get("full_name")
        owner_login = owner.get("login")
        html_url = repo.get("html_url")

        if not all(
            [
                repo_id,
                name,
                full_name,
                owner_login,
                html_url,
            ]
        ):
            continue

        github_repository_ids.add(repo_id)

        existing_repo = (
            db.query(GitHubRepository)
            .filter(
                GitHubRepository.github_repo_id
                == repo_id
            )
            .first()
        )

        if existing_repo:
            if (
                existing_repo.github_installation_id
                != installation.id
            ):
                raise ValueError(
                    "Repository belongs to another GitHub installation."
                )

            existing_repo.name = name
            existing_repo.full_name = full_name
            existing_repo.owner_login = owner_login
            existing_repo.is_private = repo.get(
                "private",
                False,
            )
            existing_repo.html_url = html_url
            existing_repo.default_branch = repo.get(
                "default_branch"
            )

            # Repository is currently accessible.
            existing_repo.is_active = True

        else:
            db.add(
                GitHubRepository(
                    github_repo_id=repo_id,
                    github_installation_id=installation.id,
                    name=name,
                    full_name=full_name,
                    owner_login=owner_login,
                    is_private=repo.get(
                        "private",
                        False,
                    ),
                    html_url=html_url,
                    default_branch=repo.get(
                        "default_branch"
                    ),
                    is_active=True,
                )
            )

    # Get every repository currently stored for this installation.
    stored_repositories = (
        db.query(GitHubRepository)
        .filter(
            GitHubRepository.github_installation_id
            == installation.id
        )
        .all()
    )

    # Anything stored in RegForge but no longer returned
    # by GitHub is no longer accessible.
    deactivated_count = 0

    for repository in stored_repositories:
        if (
            repository.github_repo_id
            not in github_repository_ids
        ):
            if repository.is_active:
                repository.is_active = False
                deactivated_count += 1

    db.commit()

    active_count = len(github_repository_ids)

    return (
        f"Repository reconciliation completed. "
        f"{active_count} active repositories, "
        f"{deactivated_count} repositories deactivated."
    )