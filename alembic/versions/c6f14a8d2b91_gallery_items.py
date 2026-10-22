"""add staff-managed public gallery items

Revision ID: c6f14a8d2b91
Revises: b5c43a908e11
Create Date: 2026-10-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "c6f14a8d2b91"
down_revision: Union[str, Sequence[str], None] = "b5c43a908e11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "gallery_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("stored_filename", sa.String(length=80), nullable=False),
        sa.Column("mime_type", sa.String(length=32), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("caption", sa.String(length=180), nullable=False),
        sa.Column("alt_text", sa.String(length=240), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("stored_filename", name="uq_gallery_items_stored_filename"),
    )
    op.create_index("ix_gallery_items_category", "gallery_items", ["category"])
    op.create_index("ix_gallery_items_position", "gallery_items", ["position"])
    op.create_index("ix_gallery_items_published", "gallery_items", ["published"])


def downgrade() -> None:
    op.drop_index("ix_gallery_items_published", table_name="gallery_items")
    op.drop_index("ix_gallery_items_position", table_name="gallery_items")
    op.drop_index("ix_gallery_items_category", table_name="gallery_items")
    op.drop_table("gallery_items")
