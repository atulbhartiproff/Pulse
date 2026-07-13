"""Add Spotify access-token expiry.

Revision ID: c8a4f7b9d2e6
Revises: b3c9e8d2a1f4
Create Date: 2026-07-12 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "c8a4f7b9d2e6"
down_revision = "b3c9e8d2a1f4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user", sa.Column("spotify_token_expires_at", sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("user", "spotify_token_expires_at")
