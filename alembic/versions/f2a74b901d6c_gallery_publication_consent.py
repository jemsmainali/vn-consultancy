"""record staff publication permission for gallery photos

Revision ID: f2a74b901d6c
Revises: c6f14a8d2b91
Create Date: 2026-10-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f2a74b901d6c"
down_revision: Union[str, Sequence[str], None] = "c6f14a8d2b91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "gallery_items",
        sa.Column("publication_authorized", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("gallery_items", "publication_authorized")
