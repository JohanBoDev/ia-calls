"""add estado_gesi to tickets

Revision ID: d1e2f3a4b5c6
Revises: c7d8e9f0a1b2
Create Date: 2026-03-16

"""
from alembic import op
import sqlalchemy as sa

revision = 'd1e2f3a4b5c6'
down_revision = 'c7d8e9f0a1b2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tickets', sa.Column('estado_gesi', sa.String(10), nullable=True))


def downgrade() -> None:
    op.drop_column('tickets', 'estado_gesi')
