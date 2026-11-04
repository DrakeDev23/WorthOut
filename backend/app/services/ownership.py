from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, WorkoutRoutine, WorkoutSession


class OwnershipViolation(Exception):
    """Raised when a resource is absent or belongs to another user."""


async def require_owned_routine(
    session: AsyncSession, *, user_id: UUID, routine_id: UUID
) -> WorkoutRoutine:
    routine = await session.scalar(
        select(WorkoutRoutine).where(
            WorkoutRoutine.id == routine_id,
            WorkoutRoutine.user_id == user_id,
            WorkoutRoutine.deleted_at.is_(None),
        )
    )
    if routine is None:
        raise OwnershipViolation('Routine is not owned by the authenticated user.')
    return routine


async def require_owned_session(
    session: AsyncSession, *, user_id: UUID, workout_session_id: UUID
) -> WorkoutSession:
    workout_session = await session.scalar(
        select(WorkoutSession).where(
            WorkoutSession.id == workout_session_id,
            WorkoutSession.user_id == user_id,
            WorkoutSession.deleted_at.is_(None),
        )
    )
    if workout_session is None:
        raise OwnershipViolation('Workout session is not owned by the authenticated user.')
    return workout_session


async def require_user(session: AsyncSession, *, user_id: UUID) -> User:
    user = await session.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if user is None:
        raise OwnershipViolation('User is not available.')
    return user
