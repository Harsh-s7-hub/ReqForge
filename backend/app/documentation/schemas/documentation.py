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


class DocumentationCatalogVersion(BaseModel):
    id: int
    version_number: int
    source_commit_sha: str
    status: str
    created_at: datetime
    word_count: int
    line_count: int


class DocumentationCatalogItem(BaseModel):
    id: int
    project_id: int
    project_name: str
    repository_name: str
    title: str
    status: str
    versions: list[DocumentationCatalogVersion]


class DocumentationCatalogResponse(BaseModel):
    documents: list[DocumentationCatalogItem]


class DocumentationCommitRequest(BaseModel):
    commit_message: str = Field(
        default="docs: update README.md via RegForge AI"
    )
    file_path: str = Field(default="README.md")
    branch: str | None = None


class DocumentationCommitResponse(BaseModel):
    commit_sha: str
    html_url: str
    file_path: str
    branch: str


class DocumentationStatusResponse(BaseModel):
    has_documentation: bool
    documentation_id: int | None = None
    latest_version_id: int | None = None
    version_number: int | None = None
    status: str
    is_stale: bool = False
    source_commit_sha: str | None = None
    current_commit_sha: str | None = None
