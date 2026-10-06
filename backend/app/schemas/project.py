from pydantic import BaseModel, Field, ConfigDict


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    repository_id: int = Field(gt=0)
    description: str | None = Field(
        default=None,
        max_length=2000,
    )


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None

    repository_id: int
    repository_name: str
    repository_url: str

    repository_access_active: bool = True
    current_analysis_id: int | None = None

    model_config = ConfigDict(from_attributes=True)