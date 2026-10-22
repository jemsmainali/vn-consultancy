"""add persisted student enquiries and lead workflow

Revision ID: e812c9f2a731
Revises: d16b16aa6abf
Create Date: 2026-10-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e812c9f2a731"
down_revision: Union[str, Sequence[str], None] = "d16b16aa6abf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "student_enquiries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reference", sa.String(length=16), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("preferred_destination", sa.String(length=100), nullable=True),
        sa.Column("education_level", sa.String(length=80), nullable=True),
        sa.Column("study_field", sa.String(length=150), nullable=True),
        sa.Column("intended_intake", sa.String(length=80), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("privacy_consent", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("consented_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), server_default=sa.text("'new'"), nullable=False),
        sa.Column("assigned_to_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("follow_up_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "status IN ('new', 'contacted', 'counselling', 'documents_pending', "
            "'application_in_progress', 'submitted', 'decision_received', 'closed')",
            name="ck_student_enquiries_status",
        ),
        sa.ForeignKeyConstraint(["assigned_to_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reference"),
    )
    op.create_index(
        "ix_student_enquiries_status_created",
        "student_enquiries",
        ["status", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_student_enquiries_assigned_to",
        "student_enquiries",
        ["assigned_to_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_student_enquiries_assigned_to", table_name="student_enquiries")
    op.drop_index("ix_student_enquiries_status_created", table_name="student_enquiries")
    op.drop_table("student_enquiries")
