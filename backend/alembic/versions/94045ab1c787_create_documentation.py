"""create documentation

Revision ID: 94045ab1c787
Revises: 708302e066a8
Create Date: 2026-10-07 09:55:40.081941

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "94045ab1c787"
down_revision: Union[str, Sequence[str], None] = "708302e066a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create project documentation tables."""

    # ------------------------------------------------------------------
    # Project Documentation
    #
    # Represents the logical documentation item belonging to a project.
    #
    # Example:
    #
    # Project #2
    #   ├── Documentation #1
    #   ├── Documentation #2
    #   └── Documentation #3
    #
    # Each documentation item is associated with the analysis/commit
    # from which it was generated.
    # ------------------------------------------------------------------

    op.create_table(
        "project_documentations",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey(
                "projects.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "source_analysis_id",
            sa.Integer(),
            sa.ForeignKey(
                "project_analysis.id",
                ondelete="SET NULL",
            ),
            nullable=True,
        ),
        sa.Column(
            "source_commit_sha",
            sa.String(length=40),
            nullable=False,
        ),
        sa.Column(
            "documentation_number",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "title",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "last_generated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "committed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "committed_commit_sha",
            sa.String(length=40),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_project_documentations_project_id",
        "project_documentations",
        ["project_id"],
    )

    op.create_index(
        "ix_project_documentations_source_analysis_id",
        "project_documentations",
        ["source_analysis_id"],
    )

    op.create_index(
        "ix_project_documentations_source_commit_sha",
        "project_documentations",
        ["source_commit_sha"],
    )

    op.create_index(
        "ix_project_documentations_status",
        "project_documentations",
        ["status"],
    )

    op.create_index(
        "ix_project_documentations_project_number",
        "project_documentations",
        ["project_id", "documentation_number"],
        unique=True,
    )

    # ------------------------------------------------------------------
    # Documentation Versions
    #
    # Every AI generation / regeneration / human edit / accepted version
    # is stored here.
    #
    # Example:
    #
    # Documentation #1
    #   ├── Version 1  -> AI generated
    #   ├── Version 2  -> regenerated
    #   ├── Version 3  -> human edited
    #   └── Version 4  -> committed
    # ------------------------------------------------------------------

    op.create_table(
        "documentation_versions",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column(
            "documentation_id",
            sa.Integer(),
            sa.ForeignKey(
                "project_documentations.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "analysis_id",
            sa.Integer(),
            sa.ForeignKey(
                "project_analysis.id",
                ondelete="SET NULL",
            ),
            nullable=True,
        ),
        sa.Column(
            "version_number",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "source_commit_sha",
            sa.String(length=40),
            nullable=False,
        ),
        sa.Column(
            "content",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "ai_generated_content",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "generation_type",
            sa.String(length=30),
            nullable=False,
            server_default="initial",
        ),
        sa.Column(
            "model_name",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "generation_metadata",
            sa.JSON(),
            nullable=True,
        ),
        sa.Column(
            "rejection_reason",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "commit_sha",
            sa.String(length=40),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "committed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_documentation_versions_documentation_id",
        "documentation_versions",
        ["documentation_id"],
    )

    op.create_index(
        "ix_documentation_versions_analysis_id",
        "documentation_versions",
        ["analysis_id"],
    )

    op.create_index(
        "ix_documentation_versions_source_commit_sha",
        "documentation_versions",
        ["source_commit_sha"],
    )

    op.create_index(
        "ix_documentation_versions_status",
        "documentation_versions",
        ["status"],
    )

    op.create_index(
        "ix_documentation_versions_document_version",
        "documentation_versions",
        ["documentation_id", "version_number"],
        unique=True,
    )


def downgrade() -> None:
    """Drop documentation tables."""

    op.drop_index(
        "ix_documentation_versions_document_version",
        table_name="documentation_versions",
    )

    op.drop_index(
        "ix_documentation_versions_status",
        table_name="documentation_versions",
    )

    op.drop_index(
        "ix_documentation_versions_source_commit_sha",
        table_name="documentation_versions",
    )

    op.drop_index(
        "ix_documentation_versions_analysis_id",
        table_name="documentation_versions",
    )

    op.drop_index(
        "ix_documentation_versions_documentation_id",
        table_name="documentation_versions",
    )

    op.drop_table("documentation_versions")

    op.drop_index(
        "ix_project_documentations_project_number",
        table_name="project_documentations",
    )

    op.drop_index(
        "ix_project_documentations_status",
        table_name="project_documentations",
    )

    op.drop_index(
        "ix_project_documentations_source_commit_sha",
        table_name="project_documentations",
    )

    op.drop_index(
        "ix_project_documentations_source_analysis_id",
        table_name="project_documentations",
    )

    op.drop_index(
        "ix_project_documentations_project_id",
        table_name="project_documentations",
    )

    op.drop_table("project_documentations")