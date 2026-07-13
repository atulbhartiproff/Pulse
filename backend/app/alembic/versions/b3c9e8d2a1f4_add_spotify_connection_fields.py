"""Add Spotify connection fields to user.

Revision ID: b3c9e8d2a1f4
Revises: fe56fa70289e
Create Date: 2026-07-12 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "b3c9e8d2a1f4"
down_revision = "fe56fa70289e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user", sa.Column("spotify_id", sa.String(length=255), nullable=True))
    op.add_column("user", sa.Column("spotify_access_token", sa.Text(), nullable=True))
    op.add_column("user", sa.Column("spotify_refresh_token", sa.Text(), nullable=True))
    op.add_column("user", sa.Column("last_sync", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_user_spotify_id", "user", ["spotify_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_user_spotify_id", table_name="user")
    op.drop_column("user", "last_sync")
    op.drop_column("user", "spotify_refresh_token")
    op.drop_column("user", "spotify_access_token")
    op.drop_column("user", "spotify_id")
