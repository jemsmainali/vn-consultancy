"""mark gallery photos for the public Success Stories row

Revision ID: a9e4d2c7b815
Revises: e5b0c3f19a84
Create Date: 2026-11-05

Additive and reversible: one nullable boolean (server default false), so existing
rows and API clients are unaffected; downgrade drops only this column.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a9e4d2c7b815"
down_revision: Union[str, Sequence[str], None] = "e5b0c3f19a84"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "gallery_items",
        sa.Column("is_success_story", sa.Boolean(), nullable=True, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("gallery_items", "is_success_story")
