from sqlalchemy.orm import Session
from app.models.user import User

def get_user_by_github_id(
  db:Session,
  github_id:int
)-> User | None :
    return (
        db.query(User)
        .filter(
            User.github_id==github_id
        )
        .first()
    )

def create_user(
        db:Session,
        github_user:dict
) -> User :
    user = User(
        github_id=github_user["id"],
        github_username=github_user["login"],
        name=github_user.get("name"),
        avatar_url=github_user.get("avatar_url"),
        profile_url=github_user.get("html_url")
    )
    db.add(user)
    db.commit()

    db.refresh(user)

    return user

def update_user(
        db:Session,
        user:User,
        github_user:dict
) -> User :
    user.github_username = github_user["login"]

    user.name = github_user.get("name")

    user.avatar_url = github_user.get("avatar_url")

    user.profile_url = github_user.get("html_url")


    db.commit()

    db.refresh(user)

    return user