"""Align documentation persistence with versioned generation jobs.

Revision ID: a3b7c9d2e4f1
Revises: 94045ab1c787
Create Date: 2026-10-27
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a3b7c9d2e4f1"
down_revision: Union[str, Sequence[str], None] = "94045ab1c787"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Make queued documentation versions and durable job records possible."""
    op.add_column(
        "project_documentations",
        sa.Column(
            "document_type",
            sa.String(length=50),
            nullable=True,
            server_default="repository",
        ),
    )

    # A historical database may contain more than one documentation row for a
    # project. Preserve every row: the newest remains the project's repository
    # document and older rows become explicitly legacy records before enforcing
    # the one-document-type-per-project rule.
    op.execute(
        """
        WITH ranked_documentations AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY project_id
                    ORDER BY updated_at DESC, id DESC
                ) AS row_number
            FROM project_documentations
        )
        UPDATE project_documentations AS documentation
        SET document_type = 'legacy-' || documentation.id::text
        FROM ranked_documentations AS ranked
        WHERE documentation.id = ranked.id
          AND ranked.row_number > 1
        """
    )
    op.alter_column(
        "project_documentations",
        "document_type",
        existing_type=sa.String(length=50),
        nullable=False,
        server_default="repository",
    )
    op.create_index(
        "ix_project_documentations_project_type",
        "project_documentations",
        ["project_id", "document_type"],
        unique=True,
    )

    op.alter_column(
        "documentation_versions",
        "content",
        existing_type=sa.Text(),
        nullable=True,
    )
    op.add_column(
        "documentation_versions",
        sa.Column("failure_reason", sa.Text(), nullable=True),
    )

    op.create_table(
        "documentation_generation_jobs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "documentation_version_id",
            sa.Integer(),
            sa.ForeignKey("documentation_versions.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("celery_task_id", sa.String(length=255), nullable=True, unique=True),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="queued",
        ),
        sa.Column(
            "attempt_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "max_attempts",
            sa.Integer(),
            nullable=False,
            server_default="3",
        ),
        sa.Column("error_code", sa.String(length=100), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_documentation_generation_jobs_status_created",
        "documentation_generation_jobs",
        ["status", "created_at"],
    )


def downgrade() -> None:
    """Reverse the schema changes introduced by this revision."""
    op.drop_index(
        "ix_documentation_generation_jobs_status_created",
        table_name="documentation_generation_jobs",
    )
    op.drop_table("documentation_generation_jobs")
    op.drop_column("documentation_versions", "failure_reason")
    op.alter_column(
        "documentation_versions",
        "content",
        existing_type=sa.Text(),
        nullable=False,
    )
    op.drop_index(
        "ix_project_documentations_project_type",
        table_name="project_documentations",
    )
    op.drop_column("project_documentations", "document_type")
