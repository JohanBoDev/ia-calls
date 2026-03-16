"""add reintento_en to tickets

Revision ID: a1b2c3d4e5f6
Revises: 97da187dbd36
Create Date: 2026-03-16

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '97da187dbd36'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tickets', sa.Column('reintento_en', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('tickets', 'reintento_en')
