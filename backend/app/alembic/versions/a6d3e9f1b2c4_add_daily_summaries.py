"""Add daily listening summaries.

Revision ID: a6d3e9f1b2c4
Revises: f2c5a7d9e4b6
Create Date: 2026-07-12 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "a6d3e9f1b2c4"
down_revision = "f2c5a7d9e4b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dailysummary",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("total_minutes", sa.Float(), nullable=False),
        sa.Column("happy_minutes", sa.Float(), nullable=False),
        sa.Column("sad_minutes", sa.Float(), nullable=False),
        sa.Column("calm_minutes", sa.Float(), nullable=False),
        sa.Column("energetic_minutes", sa.Float(), nullable=False),
        sa.Column("dominant_mood", sa.String(length=50), nullable=False),
        sa.Column("ai_summary", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "date", name="uq_daily_summary_user_date"),
    )
    op.create_index("ix_daily_summary_user_date", "dailysummary", ["user_id", "date"])


def downgrade() -> None:
    op.drop_index("ix_daily_summary_user_date", table_name="dailysummary")
    op.drop_table("dailysummary")
