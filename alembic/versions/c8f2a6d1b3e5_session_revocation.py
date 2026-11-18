"""session revocation: revoked tokens table and users.sessions_valid_after

Revision ID: c8f2a6d1b3e5
Revises: b7e3f9a1c2d4
Create Date: 2026-11-18

- New table `revoked_tokens`: the jti of each access/refresh token that was signed out, kept until it would have expired anyway.
- New nullable column `users.sessions_valid_after`: tokens issued before it are refused (set on password reset and deactivation).
Both are additive; downgrade drops them and nothing else depends on them.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "c8f2a6d1b3e5"
down_revision: Union[str, Sequence[str], None] = "b7e3f9a1c2d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "revoked_tokens",
        sa.Column("jti", sa.String(64), primary_key=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_revoked_tokens_expires_at", "revoked_tokens", ["expires_at"])
    op.add_column("users", sa.Column("sessions_valid_after", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "sessions_valid_after")
    op.drop_index("ix_revoked_tokens_expires_at", table_name="revoked_tokens")
    op.drop_table("revoked_tokens")
