from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.documentation_generation_job import DocumentationGenerationJob


def dispatch_generation_job(db: Session, job: DocumentationGenerationJob) -> str:
    """Assign a stable Celery ID and enqueue one durable generation job."""
    from app.workers.documentation.tasks import generate_documentation

    task_id = str(uuid4())
    job.celery_task_id = task_id
    db.commit()
    generate_documentation.apply_async(
        args=[job.id],
        task_id=task_id,
        queue="documentation",
    )
    return task_id
