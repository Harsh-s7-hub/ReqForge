from fastapi import FastAPI
from app.auth.oauth import router as oauth_router

app = FastAPI(
    title="RegForge API",
    description="AI powered repository maintenance and DevOps automation platform.",
    version="1.0.0",
)

app.include_router(oauth_router)

@app.get("/")
async def root():
    return {
        "message":"Welcome to RegForge API",
        "status":"running",
    }

@app.get("/health")
async def health_check():
    return {
        "status":"healthy",
        "application":"RegForge",
    }