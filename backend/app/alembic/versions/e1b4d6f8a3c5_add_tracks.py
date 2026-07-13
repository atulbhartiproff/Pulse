"""Add listening history tracks.

Revision ID: e1b4d6f8a3c5
Revises: c8a4f7b9d2e6
Create Date: 2026-07-12 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "e1b4d6f8a3c5"
down_revision = "c8a4f7b9d2e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "track",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("spotify_track_id", sa.String(length=255), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("artist", sa.String(length=1000), nullable=False),
        sa.Column("album", sa.String(length=1000), nullable=False),
        sa.Column("track_name", sa.String(length=1000), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("played_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "spotify_track_id",
            "played_at",
            name="uq_track_user_spotify_track_played_at",
        ),
    )
    op.create_index("ix_track_spotify_track_id", "track", ["spotify_track_id"])
    op.create_index("ix_track_user_played_at", "track", ["user_id", "played_at"])


def downgrade() -> None:
    op.drop_index("ix_track_user_played_at", table_name="track")
    op.drop_index("ix_track_spotify_track_id", table_name="track")
    op.drop_table("track")
