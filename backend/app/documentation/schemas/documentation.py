from datetime import datetime

from pydantic import BaseModel, Field


class DocumentationContentUpdate(BaseModel):
    content: str = Field(min_length=1)


class DocumentationVersionResponse(BaseModel):
    id: int
    documentation_id: int
    analysis_id: int | None
    version_number: int
    source_commit_sha: str
    content: str | None
    ai_generated_content: str | None
    status: str
    model_name: str | None
    failure_reason: str | None
    created_at: datetime
    updated_at: datetime


class DocumentationGenerationResponse(BaseModel):
    documentation_id: int
    version_id: int
    job_id: int
    status: str
