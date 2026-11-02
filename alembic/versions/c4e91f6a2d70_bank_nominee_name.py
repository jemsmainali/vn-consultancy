"""add nominee name to user bank details

Revision ID: c4e91f6a2d70
Revises: b8d2e47c1a35
Create Date: 2026-11-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4e91f6a2d70"
down_revision: Union[str, Sequence[str], None] = "b8d2e47c1a35"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Nullable so rows saved before this column existed stay valid.
    op.add_column("user_bank_details", sa.Column("nominee_name", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("user_bank_details", "nominee_name")
