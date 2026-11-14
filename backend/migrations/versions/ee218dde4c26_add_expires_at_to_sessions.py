"""add_expires_at_to_sessions

Revision ID: ee218dde4c26
Revises: 15249a199165
Create Date: 2026-11-14 20:51:23.284629
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ee218dde4c26'
down_revision: Union[str, Sequence[str], None] = '15249a199165'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # sessions.expires_at — kolom utama untuk token expiry
    op.add_column('sessions', sa.Column(
        'expires_at', sa.DateTime(timezone=True), nullable=True
    ))

    # accounts.account_role — nullable, aman
    op.add_column('accounts', sa.Column(
        'account_role', sa.Text(), nullable=True
    ))

    # accounts.is_current — tambah dengan server_default agar tidak NOT NULL violation
    op.add_column('accounts', sa.Column(
        'is_current', sa.Boolean(), nullable=False,
        server_default=sa.text('true')
    ))

    # categories.is_cogs — tambah dengan server_default
    op.add_column('categories', sa.Column(
        'is_cogs', sa.Boolean(), nullable=False,
        server_default=sa.text('false')
    ))


def downgrade() -> None:
    op.drop_column('sessions', 'expires_at')
    op.drop_column('categories', 'is_cogs')
    op.drop_column('accounts', 'is_current')
    op.drop_column('accounts', 'account_role')
