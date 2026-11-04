import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class SyncMixin:
    server_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default='1')
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class User(TimestampMixin, Base):
    __tablename__ = 'users'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    routines: Mapped[list['WorkoutRoutine']] = relationship(back_populates='user', cascade='all, delete-orphan')
    sessions: Mapped[list['WorkoutSession']] = relationship(back_populates='user', cascade='all, delete-orphan')


class Exercise(TimestampMixin, Base):
    __tablename__ = 'exercises'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    instructions: Mapped[list[str] | None] = mapped_column(JSONB)
    tips: Mapped[list[str] | None] = mapped_column(JSONB)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)
    tracking_type: Mapped[str] = mapped_column(String(50), nullable=False)
    default_sets: Mapped[int | None] = mapped_column(Integer)
    default_reps: Mapped[int | None] = mapped_column(Integer)
    default_rest_seconds: Mapped[int | None] = mapped_column(Integer)
    accent_color: Mapped[str | None] = mapped_column(String(32))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default='true')

    __table_args__ = (
        CheckConstraint("difficulty IN ('beginner', 'intermediate', 'advanced')", name='ck_exercises_difficulty'),
        CheckConstraint("tracking_type IN ('reps', 'duration', 'weight_reps')", name='ck_exercises_tracking_type'),
        Index('idx_exercises_active_diff', 'is_active', 'difficulty'),
    )


class Equipment(TimestampMixin, Base):
    __tablename__ = 'equipment'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


class MuscleGroup(TimestampMixin, Base):
    __tablename__ = 'muscle_groups'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


class ExerciseEquipment(Base):
    __tablename__ = 'exercise_equipment'
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('exercises.id', ondelete='CASCADE'), primary_key=True)
    equipment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('equipment.id', ondelete='CASCADE'), primary_key=True)


class ExerciseMuscleGroup(Base):
    __tablename__ = 'exercise_muscle_groups'
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('exercises.id', ondelete='CASCADE'), primary_key=True)
    muscle_group_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('muscle_groups.id', ondelete='CASCADE'), primary_key=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default='true')


class WorkoutRoutine(TimestampMixin, SyncMixin, Base):
    __tablename__ = 'workout_routines'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(50))

    user: Mapped[User] = relationship(back_populates='routines')
    exercises: Mapped[list['RoutineExercise']] = relationship(back_populates='routine', cascade='all, delete-orphan')
    sessions: Mapped[list['WorkoutSession']] = relationship(back_populates='routine')

    __table_args__ = (
        UniqueConstraint('user_id', 'id', name='uq_routines_user_id_id'),
        Index('idx_routines_user_deleted', 'user_id', 'deleted_at'),
        Index('idx_routines_server_sync', 'user_id', 'server_updated_at'),
    )


class RoutineExercise(TimestampMixin, SyncMixin, Base):
    __tablename__ = 'routine_exercises'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    routine_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('workout_routines.id', ondelete='CASCADE'), nullable=False)
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('exercises.id', ondelete='RESTRICT'), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    target_sets: Mapped[int] = mapped_column(Integer, nullable=False)
    target_reps: Mapped[int | None] = mapped_column(Integer)
    target_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    rest_seconds: Mapped[int] = mapped_column(Integer, nullable=False, server_default='60')

    routine: Mapped[WorkoutRoutine] = relationship(back_populates='exercises')

    __table_args__ = (
        UniqueConstraint('routine_id', 'position', name='uq_routine_exercises_position'),
        CheckConstraint('position > 0', name='ck_routine_exercises_position_positive'),
        CheckConstraint('target_sets > 0', name='ck_routine_exercises_target_sets_positive'),
        CheckConstraint('target_reps IS NULL OR target_reps >= 0', name='ck_routine_exercises_target_reps_nonnegative'),
        CheckConstraint('target_duration_seconds IS NULL OR target_duration_seconds >= 0', name='ck_routine_exercises_duration_nonnegative'),
        CheckConstraint('weight_kg IS NULL OR weight_kg >= 0', name='ck_routine_exercises_weight_nonnegative'),
        CheckConstraint('rest_seconds >= 0', name='ck_routine_exercises_rest_nonnegative'),
        Index('idx_routine_ex_routine', 'routine_id', 'deleted_at'),
        Index('idx_routine_ex_server_sync', 'server_updated_at'),
    )


class WorkoutSession(TimestampMixin, SyncMixin, Base):
    __tablename__ = 'workout_sessions'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    routine_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('workout_routines.id', ondelete='SET NULL'))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates='sessions')
    routine: Mapped[WorkoutRoutine | None] = relationship(back_populates='sessions')
    exercises: Mapped[list['WorkoutExercise']] = relationship(back_populates='session', cascade='all, delete-orphan')

    __table_args__ = (
        CheckConstraint("status IN ('in_progress', 'completed', 'cancelled')", name='ck_workout_sessions_status'),
        CheckConstraint('duration_seconds IS NULL OR duration_seconds >= 0', name='ck_workout_sessions_duration_nonnegative'),
        Index('idx_sessions_user_started', 'user_id', 'started_at'),
        Index('idx_sessions_user_status', 'user_id', 'status'),
        Index('idx_sessions_server_sync', 'user_id', 'server_updated_at'),
    )


class WorkoutExercise(TimestampMixin, SyncMixin, Base):
    __tablename__ = 'workout_exercises'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('workout_sessions.id', ondelete='CASCADE'), nullable=False)
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('exercises.id', ondelete='RESTRICT'), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    session: Mapped[WorkoutSession] = relationship(back_populates='exercises')
    sets: Mapped[list['ExerciseSet']] = relationship(back_populates='workout_exercise', cascade='all, delete-orphan')

    __table_args__ = (
        UniqueConstraint('session_id', 'position', name='uq_workout_exercises_position'),
        CheckConstraint('position > 0', name='ck_workout_exercises_position_positive'),
        Index('idx_workout_ex_session', 'session_id', 'deleted_at'),
        Index('idx_workout_ex_server_sync', 'server_updated_at'),
    )


class ExerciseSet(TimestampMixin, SyncMixin, Base):
    __tablename__ = 'exercise_sets'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workout_exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('workout_exercises.id', ondelete='CASCADE'), nullable=False)
    set_number: Mapped[int] = mapped_column(Integer, nullable=False)
    repetitions: Mapped[int | None] = mapped_column(Integer)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default='false')

    workout_exercise: Mapped[WorkoutExercise] = relationship(back_populates='sets')

    __table_args__ = (
        UniqueConstraint('workout_exercise_id', 'set_number', name='uq_exercise_sets_number'),
        CheckConstraint('set_number > 0', name='ck_exercise_sets_number_positive'),
        CheckConstraint('repetitions IS NULL OR repetitions >= 0', name='ck_exercise_sets_repetitions_nonnegative'),
        CheckConstraint('weight_kg IS NULL OR weight_kg >= 0', name='ck_exercise_sets_weight_nonnegative'),
        CheckConstraint('duration_seconds IS NULL OR duration_seconds >= 0', name='ck_exercise_sets_duration_nonnegative'),
        Index('idx_sets_workout_ex', 'workout_exercise_id', 'set_number'),
        Index('idx_sets_server_sync', 'server_updated_at'),
    )


__all__ = [
    'Base', 'User', 'Exercise', 'Equipment', 'MuscleGroup', 'ExerciseEquipment',
    'ExerciseMuscleGroup', 'WorkoutRoutine', 'RoutineExercise', 'WorkoutSession',
    'WorkoutExercise', 'ExerciseSet',
]
