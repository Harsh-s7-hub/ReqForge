from fastapi import FastAPI
from app.auth.oauth import router as oauth_router
from app.routes.user import router as user_router
from app.routes.auth import router as auth_router
from app.routes.webhooks import router as webhook_router 
from app.routes.github import router as github_router
from app.routes.project import router as projects_router

app = FastAPI(
    title="RegForge API",
    description="AI powered repository maintenance and DevOps automation platform.",
    version="1.0.0",
)

app.include_router(oauth_router)
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(webhook_router)
app.include_router(github_router)
app.include_router(projects_router)

@app.get("/")
async def root():
    return {
        "message":"Welcome to RegForge API",
        "status":"running",
    }

@app.get("/health",tags=["Health"])
async def health_check():
    return {
        "status":"healthy",
        "application":"RegForge",
    }