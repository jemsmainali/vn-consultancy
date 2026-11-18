"""email verification links, agent role, one account per email in any letter case

Revision ID: b7e3f9a1c2d4
Revises: a9e4d2c7b815
Create Date: 2026-11-18

- New role value `agent` (signs up, verifies, then waits for staff approval like a principal).
- New table `email_verification_tokens`: only a SHA-256 hash of each signed link token, with used_at.
- Every existing user is marked verified, as requested when link verification was introduced.
- Unique index on lower(email), so Asha@x.com and asha@x.com can't be two accounts.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "b7e3f9a1c2d4"
down_revision: Union[str, Sequence[str], None] = "a9e4d2c7b815"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'agent'")

    op.create_table(
        "email_verification_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_email_verification_tokens_user_id", "email_verification_tokens", ["user_id"])

    op.execute("UPDATE users SET is_verified = true WHERE is_verified = false")

    duplicates = op.get_bind().execute(sa.text(
        "SELECT lower(email) FROM users GROUP BY lower(email) HAVING count(*) > 1"
    )).scalars().all()
    if duplicates:
        raise RuntimeError(
            "These addresses belong to more than one account when letter case is ignored; "
            f"merge or rename them, then rerun the migration: {', '.join(duplicates)}"
        )
    op.create_index("uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True)


def downgrade() -> None:
    op.drop_index("uq_users_email_lower", table_name="users")
    op.drop_index("ix_email_verification_tokens_user_id", table_name="email_verification_tokens")
    op.drop_table("email_verification_tokens")
    # Left in place on purpose: Postgres cannot drop an enum value that rows may use,
    # and which users were unverified before the upgrade is not recorded anywhere.
