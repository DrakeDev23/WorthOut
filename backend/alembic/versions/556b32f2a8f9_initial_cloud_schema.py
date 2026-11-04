"""initial cloud schema

Revision ID: 556b32f2a8f9
Revises: 
Create Date: 2026-11-04 11:21:12.042404
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '556b32f2a8f9'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    uuid = postgresql.UUID(as_uuid=True)
    timestamptz = sa.DateTime(timezone=True)
    op.create_table(
        'users',
        sa.Column('id', uuid, nullable=False),
        sa.Column('clerk_user_id', sa.String(length=255), nullable=False),
        sa.Column('display_name', sa.String(length=255)),
        sa.Column('email', sa.String(length=255)),
        sa.Column('created_at', timestamptz, server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', timestamptz, server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', timestamptz),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('clerk_user_id'),
    )
    op.create_index('idx_users_clerk_id', 'users', ['clerk_user_id'])

    op.create_table(
        'exercises',
        sa.Column('id', uuid, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('instructions', postgresql.JSONB()),
        sa.Column('tips', postgresql.JSONB()),
        sa.Column('difficulty', sa.String(length=50), nullable=False),
        sa.Column('tracking_type', sa.String(length=50), nullable=False),
        sa.Column('default_sets', sa.Integer()),
        sa.Column('default_reps', sa.Integer()),
        sa.Column('default_rest_seconds', sa.Integer()),
        sa.Column('accent_color', sa.String(length=32)),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', timestamptz, server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', timestamptz, server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("difficulty IN ('beginner', 'intermediate', 'advanced')", name='ck_exercises_difficulty'),
        sa.CheckConstraint("tracking_type IN ('reps', 'duration', 'weight_reps')", name='ck_exercises_tracking_type'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_exercises_active_diff', 'exercises', ['is_active', 'difficulty'])

    for table_name, name_length in [('equipment', 100), ('muscle_groups', 100)]:
        op.create_table(
            table_name,
            sa.Column('id', uuid, nullable=False),
            sa.Column('name', sa.String(length=name_length), nullable=False),
            sa.Column('description', sa.Text()),
            sa.Column('created_at', timestamptz, server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', timestamptz, server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('name'),
        )

    op.create_table(
        'exercise_equipment',
        sa.Column('exercise_id', uuid, nullable=False),
        sa.Column('equipment_id', uuid, nullable=False),
        sa.ForeignKeyConstraint(['equipment_id'], ['equipment.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('exercise_id', 'equipment_id'),
    )
    op.create_table(
        'exercise_muscle_groups',
        sa.Column('exercise_id', uuid, nullable=False),
        sa.Column('muscle_group_id', uuid, nullable=False),
        sa.Column('is_primary', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['muscle_group_id'], ['muscle_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('exercise_id', 'muscle_group_id'),
    )

    sync_columns = [
        sa.Column('server_updated_at', timestamptz, server_default=sa.text('now()'), nullable=False),
        sa.Column('version', sa.Integer(), server_default=sa.text('1'), nullable=False),
        sa.Column('deleted_at', timestamptz),
    ]
    op.create_table(
        'workout_routines',
        sa.Column('id', uuid, nullable=False), sa.Column('user_id', uuid, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False), sa.Column('description', sa.Text()),
        sa.Column('category', sa.String(length=50)),
        sa.Column('created_at', timestamptz, server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', timestamptz, server_default=sa.text('now()'), nullable=False), *sync_columns,
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'), sa.UniqueConstraint('user_id', 'id', name='uq_routines_user_id_id'),
    )
    op.create_index('idx_routines_user_deleted', 'workout_routines', ['user_id', 'deleted_at'])
    op.create_index('idx_routines_server_sync', 'workout_routines', ['user_id', 'server_updated_at'])

    def sync_columns_for_table():
        return [
            sa.Column('server_updated_at', timestamptz, server_default=sa.text('now()'), nullable=False),
            sa.Column('version', sa.Integer(), server_default=sa.text('1'), nullable=False),
            sa.Column('deleted_at', timestamptz),
        ]

    op.create_table(
        'routine_exercises',
        sa.Column('id', uuid, nullable=False), sa.Column('routine_id', uuid, nullable=False),
        sa.Column('exercise_id', uuid, nullable=False), sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('target_sets', sa.Integer(), nullable=False), sa.Column('target_reps', sa.Integer()),
        sa.Column('target_duration_seconds', sa.Integer()), sa.Column('weight_kg', sa.Numeric(6, 2)),
        sa.Column('rest_seconds', sa.Integer(), server_default=sa.text('60'), nullable=False),
        sa.Column('created_at', timestamptz, server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', timestamptz, server_default=sa.text('now()'), nullable=False), *sync_columns_for_table(),
        sa.ForeignKeyConstraint(['routine_id'], ['workout_routines.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'), sa.UniqueConstraint('routine_id', 'position', name='uq_routine_exercises_position'),
        sa.CheckConstraint('position > 0', name='ck_routine_exercises_position_positive'),
        sa.CheckConstraint('target_sets > 0', name='ck_routine_exercises_target_sets_positive'),
        sa.CheckConstraint('target_reps IS NULL OR target_reps >= 0', name='ck_routine_exercises_target_reps_nonnegative'),
        sa.CheckConstraint('target_duration_seconds IS NULL OR target_duration_seconds >= 0', name='ck_routine_exercises_duration_nonnegative'),
        sa.CheckConstraint('weight_kg IS NULL OR weight_kg >= 0', name='ck_routine_exercises_weight_nonnegative'),
        sa.CheckConstraint('rest_seconds >= 0', name='ck_routine_exercises_rest_nonnegative'),
    )
    op.create_index('idx_routine_ex_routine', 'routine_exercises', ['routine_id', 'deleted_at'])
    op.create_index('idx_routine_ex_server_sync', 'routine_exercises', ['server_updated_at'])

    op.create_table(
        'workout_sessions',
        sa.Column('id', uuid, nullable=False), sa.Column('user_id', uuid, nullable=False),
        sa.Column('routine_id', uuid), sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('started_at', timestamptz, nullable=False), sa.Column('completed_at', timestamptz),
        sa.Column('duration_seconds', sa.Integer()), sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text()), sa.Column('created_at', timestamptz, server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', timestamptz, server_default=sa.text('now()'), nullable=False), *sync_columns_for_table(),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['routine_id'], ['workout_routines.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("status IN ('in_progress', 'completed', 'cancelled')", name='ck_workout_sessions_status'),
        sa.CheckConstraint('duration_seconds IS NULL OR duration_seconds >= 0', name='ck_workout_sessions_duration_nonnegative'),
    )
    op.create_index('idx_sessions_user_started', 'workout_sessions', ['user_id', 'started_at'])
    op.create_index('idx_sessions_user_status', 'workout_sessions', ['user_id', 'status'])
    op.create_index('idx_sessions_server_sync', 'workout_sessions', ['user_id', 'server_updated_at'])

    op.create_table(
        'workout_exercises',
        sa.Column('id', uuid, nullable=False), sa.Column('session_id', uuid, nullable=False),
        sa.Column('exercise_id', uuid, nullable=False), sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text()), sa.Column('created_at', timestamptz, server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', timestamptz, server_default=sa.text('now()'), nullable=False), *sync_columns_for_table(),
        sa.ForeignKeyConstraint(['session_id'], ['workout_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'), sa.UniqueConstraint('session_id', 'position', name='uq_workout_exercises_position'),
        sa.CheckConstraint('position > 0', name='ck_workout_exercises_position_positive'),
    )
    op.create_index('idx_workout_ex_session', 'workout_exercises', ['session_id', 'deleted_at'])
    op.create_index('idx_workout_ex_server_sync', 'workout_exercises', ['server_updated_at'])

    op.create_table(
        'exercise_sets',
        sa.Column('id', uuid, nullable=False), sa.Column('workout_exercise_id', uuid, nullable=False),
        sa.Column('set_number', sa.Integer(), nullable=False), sa.Column('repetitions', sa.Integer()),
        sa.Column('weight_kg', sa.Numeric(6, 2)), sa.Column('duration_seconds', sa.Integer()),
        sa.Column('is_completed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', timestamptz, server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', timestamptz, server_default=sa.text('now()'), nullable=False), *sync_columns_for_table(),
        sa.ForeignKeyConstraint(['workout_exercise_id'], ['workout_exercises.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'), sa.UniqueConstraint('workout_exercise_id', 'set_number', name='uq_exercise_sets_number'),
        sa.CheckConstraint('set_number > 0', name='ck_exercise_sets_number_positive'),
        sa.CheckConstraint('repetitions IS NULL OR repetitions >= 0', name='ck_exercise_sets_repetitions_nonnegative'),
        sa.CheckConstraint('weight_kg IS NULL OR weight_kg >= 0', name='ck_exercise_sets_weight_nonnegative'),
        sa.CheckConstraint('duration_seconds IS NULL OR duration_seconds >= 0', name='ck_exercise_sets_duration_nonnegative'),
    )
    op.create_index('idx_sets_workout_ex', 'exercise_sets', ['workout_exercise_id', 'set_number'])
    op.create_index('idx_sets_server_sync', 'exercise_sets', ['server_updated_at'])


def downgrade() -> None:
    for table_name in ('exercise_sets', 'workout_exercises', 'workout_sessions', 'routine_exercises', 'workout_routines', 'exercise_muscle_groups', 'exercise_equipment', 'muscle_groups', 'equipment', 'exercises', 'users'):
        op.drop_table(table_name)
