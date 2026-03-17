"""add gesi catalog tables

Revision ID: c7d8e9f0a1b2
Revises: a1b2c3d4e5f6
Create Date: 2026-03-16

"""
from alembic import op
import sqlalchemy as sa

revision = 'c7d8e9f0a1b2'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'gesi_departamentos',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('nombre', sa.String(200), unique=True, nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default='true'),
    )
    op.create_table(
        'gesi_estados_ticket',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('nombre', sa.String(200), unique=True, nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default='true'),
    )
    op.create_table(
        'gesi_origenes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('nombre', sa.String(200), unique=True, nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default='true'),
    )
    op.create_table(
        'gesi_tipos_ticket',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('nombre', sa.String(200), unique=True, nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default='true'),
    )
    op.create_table(
        'gesi_municipios',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('nombre', sa.String(200), unique=True, nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default='true'),
    )


def downgrade() -> None:
    op.drop_table('gesi_municipios')
    op.drop_table('gesi_tipos_ticket')
    op.drop_table('gesi_origenes')
    op.drop_table('gesi_estados_ticket')
    op.drop_table('gesi_departamentos')
