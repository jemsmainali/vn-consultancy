"""catch fresh databases up with columns and roles that older databases got outside Alembic

Revision ID: e5b0c3f19a84
Revises: c4e91f6a2d70
Create Date: 2026-11-02
"""
from typing import Sequence, Union

from alembic import op


revision: str = "e5b0c3f19a84"
down_revision: Union[str, Sequence[str], None] = "c4e91f6a2d70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

USER_COLUMNS = (
    ("date_of_birth", "DATE"),
    ("gender", "VARCHAR(20)"),
    ("citizenship", "VARCHAR(100)"),
    ("passport_number", "VARCHAR(50)"),
    ("target_course_level", "VARCHAR(50)"),
    ("target_field", "VARCHAR(255)"),
    ("target_country", "VARCHAR(100)"),
    ("profile_image", "VARCHAR(255)"),
)


def upgrade() -> None:
    # Every statement is IF NOT EXISTS: a no-op on databases that already have these.
    with op.get_context().autocommit_block():
        for role in ("principal", "parent", "other"):
            op.execute(f"ALTER TYPE userrole ADD VALUE IF NOT EXISTS '{role}'")
    for name, sql_type in USER_COLUMNS:
        op.execute(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {name} {sql_type}")
    op.execute("ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS purpose VARCHAR(20) NOT NULL DEFAULT 'verify'")


def downgrade() -> None:
    # Intentionally empty: on older databases these columns predate this revision and hold real data.
    pass
