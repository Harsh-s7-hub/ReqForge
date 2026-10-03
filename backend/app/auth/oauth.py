import secrets
from urllib.parse import urlencode
import httpx
from sqlalchemy.orm import Session
from fastapi import APIRouter,HTTPException,Request,Depends
from fastapi.responses import RedirectResponse,JSONResponse
from app.core.config import settings
from app.supabase_db.session import get_db

from app.services.user_service import get_user_by_github_id,create_user,update_user
from app.services.service_session import create_session

router = APIRouter(
    prefix="/api/auth/github",
    tags=["GitHub Authentication"]
)

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"

@router.get("/login")
async def github_login():
    state = secrets.token_urlsafe(32)

    params = {
        "client_id":settings.GITHUB_OAUTH_CLIENT_ID,
        "redirect_uri":settings.GITHUB_OAUTH_REDIRECT_URI,
        "scope":"read:user user:email",
        "state":state,
    }

    authorization_url = (
        f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}"
    )

    response = RedirectResponse(authorization_url)

    response.set_cookie(
        key="github_oauth_state",
        value=state,
        httponly=True,
        secure=settings.ENVIRONMENT =="production",
        samesite="lax",
        max_age=600,
        path="/api/auth/github",
    )

    return response

@router.get("/callback")
async def github_callback(
    request:Request,
    code:str,
    state:str,
    db:Session = Depends(get_db)
):
    stored_state = request.cookies.get("github_oauth_state")
    if (
        not stored_state
        or not secrets.compare_digest(stored_state,state)
    ):
        raise HTTPException(
            status_code = 400,
            detail="Invalid OAuth state."
        )

    async with httpx.AsyncClient(timeout=15.0) as client:
 
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            headers={"Accept":"application/json"},
            data={
                "client_id":settings.GITHUB_OAUTH_CLIENT_ID,
                "client_secret":settings.GITHUB_OAUTH_CLIENT_SECRET,
                "code":code,
                "redirect_uri":settings.GITHUB_OAUTH_REDIRECT_URI,
            },
        )

        if token_response.status_code !=200:
            raise HTTPException(
                status_code=502,
                detail="GitHub token exchange failed."
            )

        token_data = token_response.json()

        if token_data.get("error"):
            raise HTTPException(
                status_code=400,
                detail="GitHub Authentication Failed."
            )

        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code = 400,
                detail = "GitHub did not return an access token."
            )

        user_response = await client.get(
            GITHUB_USER_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept":"application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }
        )

        if user_response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Unable to retrieve GitHub profile."
            )

        github_user = user_response.json()

        user = get_user_by_github_id(db,github_user["id"])

        if user :
            user = update_user(
                db,
                user,
                github_user
            )

        else:
            user = create_user(
                db,github_user
            )

        session_id = create_session(
            db,
            user.id
        )


        response = JSONResponse(
            content={
                "message":"GitHub authentication successful",
                "authenticated":True,
                "github_user":{
                    "id":github_user.get("id"),
                    "login":github_user.get("login"),
                    "name":github_user.get("name"),
                    "avatar_url":github_user.get("avatar_url"),
                    "profile_url":github_user.get("html_url"),
                }
            }
        )

        response.set_cookie(
            key="regforge_session",
            value=session_id,
            httponly=True,
            secure=settings.ENVIRONMENT == "production",
            samesite="lax",
            max_age=60 * 60 * 24 * 7,
            path="/"
        )


        response.delete_cookie(
            key="github_oauth_state",
            path="/api/auth/github",
        )

        response.headers["Cache-Control"]="no-store"

        return response