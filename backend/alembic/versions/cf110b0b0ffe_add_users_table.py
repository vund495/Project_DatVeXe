"""add_users_table

Revision ID: cf110b0b0ffe
Revises: 7f4b2c3240f1
Create Date: 2026-05-30 21:33:14.868708

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'cf110b0b0ffe'
down_revision: Union[str, None] = '7f4b2c3240f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False, server_default=''),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='user'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'])


def downgrade() -> None:
    op.drop_index('ix_users_email')
    op.drop_table('users')
