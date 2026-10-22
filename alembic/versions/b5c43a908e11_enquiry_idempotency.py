"""protect enquiry retries with an idempotency key

Revision ID: b5c43a908e11
Revises: e812c9f2a731
Create Date: 2026-10-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b5c43a908e11"
down_revision: Union[str, Sequence[str], None] = "e812c9f2a731"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "student_enquiries",
        sa.Column("submission_key", postgresql.UUID(as_uuid=True), nullable=True),
    )
    # Derive unique backfill values from the existing primary keys, preserving
    # any enquiries submitted before this migration is applied.
    op.execute(
        sa.text(
            "UPDATE student_enquiries "
            "SET submission_key = md5(id::text)::uuid "
            "WHERE submission_key IS NULL"
        )
    )
    op.alter_column(
        "student_enquiries",
        "submission_key",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
    op.create_unique_constraint(
        "uq_student_enquiries_submission_key",
        "student_enquiries",
        ["submission_key"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_student_enquiries_submission_key",
        "student_enquiries",
        type_="unique",
    )
    op.drop_column("student_enquiries", "submission_key")
