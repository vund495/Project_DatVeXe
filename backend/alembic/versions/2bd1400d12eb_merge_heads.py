"""merge heads

Revision ID: 2bd1400d12eb
Revises: a1b2c3d4e5f6, b7ea3fea617e
Create Date: 2026-06-07 22:46:32.161996

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2bd1400d12eb'
down_revision: Union[str, None] = ('a1b2c3d4e5f6', 'b7ea3fea617e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
