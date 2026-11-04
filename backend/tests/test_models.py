import uuid

from sqlalchemy import CheckConstraint, UniqueConstraint

from app.db.session import AsyncSessionLocal
from app.models import Base, ExerciseSet, User, WorkoutRoutine, WorkoutSession


def test_metadata_contains_complete_cloud_schema() -> None:
    assert set(Base.metadata.tables) == {
        'users',
        'exercises',
        'equipment',
        'muscle_groups',
        'exercise_equipment',
        'exercise_muscle_groups',
        'workout_routines',
        'routine_exercises',
        'workout_sessions',
        'workout_exercises',
        'exercise_sets',
    }


def test_ownership_foreign_keys_and_cascades_are_declared() -> None:
    routine = Base.metadata.tables['workout_routines']
    session = Base.metadata.tables['workout_sessions']
    assert next(iter(routine.c.user_id.foreign_keys)).target_fullname == 'users.id'
    assert next(iter(session.c.user_id.foreign_keys)).target_fullname == 'users.id'
    assert next(iter(session.c.routine_id.foreign_keys)).ondelete == 'SET NULL'


def test_domain_relationships_are_available() -> None:
    assert User.routines.property.back_populates == 'user'
    assert WorkoutRoutine.exercises.property.back_populates == 'routine'
    assert WorkoutSession.exercises.property.back_populates == 'session'
    assert ExerciseSet.workout_exercise.property.back_populates == 'sets'


def test_constraints_cover_syncable_record_integrity() -> None:
    routine_constraints = {constraint.name for constraint in Base.metadata.tables['routine_exercises'].constraints if isinstance(constraint, (CheckConstraint, UniqueConstraint))}
    set_constraints = {constraint.name for constraint in Base.metadata.tables['exercise_sets'].constraints if isinstance(constraint, (CheckConstraint, UniqueConstraint))}
    assert 'uq_routine_exercises_position' in routine_constraints
    assert 'ck_routine_exercises_target_sets_positive' in routine_constraints
    assert 'uq_exercise_sets_number' in set_constraints
    assert 'ck_exercise_sets_number_positive' in set_constraints


def test_uuid_defaults_are_client_independent_and_uuid_shaped() -> None:
    assert uuid.UUID(str(WorkoutRoutine.__table__.c.id.default.arg(None))).version == 4
    assert uuid.UUID(str(WorkoutSession.__table__.c.id.default.arg(None))).version == 4


def test_async_session_factory_is_non_expiring() -> None:
    assert AsyncSessionLocal.kw['expire_on_commit'] is False
