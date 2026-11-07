from uuid import UUID

from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import error_body, new_request_id
from app.models import User, WorkoutRoutine, WorkoutSession


class OwnershipViolation(Exception):
    """Raised when a resource is absent or belongs to another user."""


async def ownership_violation_handler(
    _request: Request, exc: OwnershipViolation
) -> JSONResponse:
    request_id = new_request_id()
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=error_body(
            code="not_found",
            message=str(exc) if str(exc) else "Resource not found.",
            request_id=request_id,
        ),
    )


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
        raise OwnershipViolation("Routine is not owned by the authenticated user.")
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
        raise OwnershipViolation(
            "Workout session is not owned by the authenticated user."
        )
    return workout_session


async def require_user(session: AsyncSession, *, user_id: UUID) -> User:
    user = await session.scalar(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    if user is None:
        raise OwnershipViolation("User is not available.")
    return user
