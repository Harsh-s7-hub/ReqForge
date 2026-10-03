
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.github_installation import GitHubInstallation


def handle_installation_event(db: Session, payload: dict) -> str:
    action = payload.get("action")
    installation_data = payload.get("installation", {})
    account = installation_data.get("account") or {}
    sender = payload.get("sender") or {}

    installation_id = installation_data.get("id")
    account_id = account.get("id")
    account_login = account.get("login")
    account_type = account.get("type")
    sender_id = sender.get("id")

    if not all([
        installation_id,
        account_id,
        account_login,
        account_type,
    ]):
        raise ValueError("Incomplete installation payload.")

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.installation_id == installation_id
        )
        .first()
    )

    if action == "created":
        if not sender_id:
            raise ValueError("Missing GitHub sender.")

        user = (
            db.query(User)
            .filter(User.github_id == sender_id)
            .first()
        )

        if not user:
            return "Installer is not registered in RegForge."

        # Never transfer an installation to another user.
        if installation and installation.user_id != user.id:
            return "This installation is already linked to another user."

        # Check whether this user already has an installation.
        existing_user_installation = (
            db.query(GitHubInstallation)
            .filter(GitHubInstallation.user_id == user.id)
            .first()
        )

        if (
            existing_user_installation
            and existing_user_installation.installation_id != installation_id
            and existing_user_installation.is_active
        ):
            return (
                "User already has an active GitHub installation. "
                "Uninstall it before installing another."
            )

        if existing_user_installation:
            existing_user_installation.installation_id = installation_id
            existing_user_installation.account_id = account_id
            existing_user_installation.account_login = account_login
            existing_user_installation.account_type = account_type
            existing_user_installation.is_active = True
        elif installation:
            installation.is_active = True
        else:
            db.add(
                GitHubInstallation(
                    installation_id=installation_id,
                    user_id=user.id,
                    account_id=account_id,
                    account_login=account_login,
                    account_type=account_type,
                    is_active=True,
                )
            )

        db.commit()
        return "GitHub installation registered successfully."

    if not installation:
        return "Installation record not found."

    if action in ("deleted", "suspend"):
        installation.is_active = False
    elif action in ("unsuspend", "new_permissions_accepted"):
        installation.is_active = True
    else:
        return f"Installation action ignored: {action}"

    db.commit()
    return f"Installation updated: {action}"
