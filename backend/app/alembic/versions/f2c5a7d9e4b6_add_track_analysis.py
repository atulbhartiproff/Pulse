"""Add track analysis.

Revision ID: f2c5a7d9e4b6
Revises: e1b4d6f8a3c5
Create Date: 2026-07-12 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "f2c5a7d9e4b6"
down_revision = "e1b4d6f8a3c5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "trackanalysis",
        sa.Column("track_id", sa.Uuid(), nullable=False),
        sa.Column("mood", sa.String(length=50), nullable=False),
        sa.Column("energy", sa.Float(), nullable=False),
        sa.Column("valence", sa.Float(), nullable=False),
        sa.Column("danceability", sa.Float(), nullable=False),
        sa.Column("tempo", sa.Float(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["track_id"], ["track.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("track_id"),
    )


def downgrade() -> None:
    op.drop_table("trackanalysis")
