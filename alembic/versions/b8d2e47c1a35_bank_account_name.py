"""add account holder name to user bank details

Revision ID: b8d2e47c1a35
Revises: a3c7e51d9f02
Create Date: 2026-11-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8d2e47c1a35"
down_revision: Union[str, Sequence[str], None] = "a3c7e51d9f02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Nullable so rows saved before this column existed stay valid.
    op.add_column("user_bank_details", sa.Column("account_name", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("user_bank_details", "account_name")
