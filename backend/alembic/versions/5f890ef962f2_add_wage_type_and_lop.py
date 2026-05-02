"""add_wage_type_and_lop

Revision ID: 5f890ef962f2
Revises: 0b6150659d8a
Create Date: 2026-05-03 00:04:00.160694

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5f890ef962f2'
down_revision: Union[str, None] = '0b6150659d8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

wagetype_enum = sa.Enum('MONTHLY_FIXED', 'DAILY_WAGE', 'HOURLY_WAGE', name='wagetype')


def upgrade() -> None:
    # Create the PostgreSQL enum type first (idempotent)
    wagetype_enum.create(op.get_bind(), checkfirst=True)

    op.add_column('payslips', sa.Column(
        'lop_deduction', sa.Numeric(precision=12, scale=2), nullable=True
    ))
    op.add_column('salary_structures', sa.Column(
        'wage_type',
        sa.Enum('MONTHLY_FIXED', 'DAILY_WAGE', 'HOURLY_WAGE', name='wagetype', create_type=False),
        nullable=False,
        server_default='MONTHLY_FIXED',
    ))
    op.add_column('salary_structures', sa.Column(
        'daily_rate', sa.Numeric(precision=10, scale=2), nullable=True
    ))
    op.add_column('salary_structures', sa.Column(
        'hourly_rate', sa.Numeric(precision=10, scale=2), nullable=True
    ))


def downgrade() -> None:
    op.drop_column('salary_structures', 'hourly_rate')
    op.drop_column('salary_structures', 'daily_rate')
    op.drop_column('salary_structures', 'wage_type')
    op.drop_column('payslips', 'lop_deduction')
    wagetype_enum.drop(op.get_bind(), checkfirst=True)
