from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.oauth import router as oauth_router
from app.routes.user import router as user_router
from app.routes.auth import router as auth_router
from app.routes.webhooks import router as webhook_router 
from app.routes.github import router as github_router
from app.routes.project import router as projects_router
from app.routes.project_analysis import router as project_analysis_router
from app.routes.project_commits import router as project_commits_router
from app.routes.project_graph import router as project_graph_router
from app.routes.project_commit_analysis import router as project_commit_analysis_router
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="RegForge API",
    description="AI powered repository maintenance and DevOps automation platform.",
    version="1.0.1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(oauth_router)
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(webhook_router)
app.include_router(github_router)
app.include_router(projects_router)
app.include_router(project_analysis_router)
app.include_router(project_commits_router)
app.include_router(project_graph_router)
app.include_router(project_commit_analysis_router)

@app.get("/")
async def root():
    return {
        "message":"Welcome to RegForge API",
        "version":"1.0.1",
        "status":"running",
        
    }

@app.get("/health",tags=["Health"])
async def health_check():
    return {
        "status":"healthy",
        "application":"RegForge",
    }