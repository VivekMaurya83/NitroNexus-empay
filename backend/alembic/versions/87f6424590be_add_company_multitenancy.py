"""add_company_multitenancy

Revision ID: 87f6424590be
Revises: 63d0334472dc
Create Date: 2026-05-02 13:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '87f6424590be'
down_revision: Union[str, None] = '63d0334472dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create companies table
    op.create_table('companies',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_companies_id'), 'companies', ['id'], unique=False)
    op.create_index(op.f('ix_companies_name'), 'companies', ['name'], unique=False)

    # 2. Add company_id to all tables
    tables = [
        'users', 'departments', 'designations', 'employees',
        'salary_structures', 'attendances', 'leave_policies',
        'leave_allocations', 'leave_applications', 'payruns',
        'payslips', 'payrun_amendments', 'audit_logs'
    ]
    
    for table in tables:
        op.add_column(table, sa.Column('company_id', sa.Integer(), nullable=True))
        op.create_index(op.f(f'ix_{table}_company_id'), table, ['company_id'], unique=False)
        op.create_foreign_key(f'fk_{table}_company_id', table, 'companies', ['company_id'], ['id'])

    # 3. Replace unique constraints
    # Departments
    op.drop_constraint('departments_name_key', 'departments', type_='unique')
    op.create_unique_constraint('uq_departments_company_name', 'departments', ['company_id', 'name'])

    # Leave Policies
    op.drop_constraint('leave_policies_leave_type_key', 'leave_policies', type_='unique')
    op.create_unique_constraint('uq_leave_policies_company_type', 'leave_policies', ['company_id', 'leave_type'])


def downgrade() -> None:
    # 1. Revert unique constraints
    op.drop_constraint('uq_leave_policies_company_type', 'leave_policies', type_='unique')
    op.create_unique_constraint('leave_policies_leave_type_key', 'leave_policies', ['leave_type'])
    
    op.drop_constraint('uq_departments_company_name', 'departments', type_='unique')
    op.create_unique_constraint('departments_name_key', 'departments', ['name'])

    # 2. Drop company_id from all tables
    tables = [
        'audit_logs', 'payrun_amendments', 'payslips', 'payruns',
        'leave_applications', 'leave_allocations', 'leave_policies',
        'attendances', 'salary_structures', 'employees', 'designations',
        'departments', 'users'
    ]
    
    for table in tables:
        op.drop_constraint(f'fk_{table}_company_id', table, type_='foreignkey')
        op.drop_index(op.f(f'ix_{table}_company_id'), table_name=table)
        op.drop_column(table, 'company_id')

    # 3. Drop companies table
    op.drop_index(op.f('ix_companies_name'), table_name='companies')
    op.drop_index(op.f('ix_companies_id'), table_name='companies')
    op.drop_table('companies')
