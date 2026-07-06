"""add_user_permissions

Revision ID: b7ea3fea617e
Revises: cf110b0b0ffe
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7ea3fea617e'
down_revision: Union[str, None] = 'cf110b0b0ffe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('permissions', sa.Text(), nullable=False, server_default=''))


def downgrade() -> None:
    op.drop_column('users', 'permissions')
