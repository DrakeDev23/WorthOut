from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user
from app.models.entities import User
from app.schemas.exercises import ExerciseListResponse, ExerciseResponse
from app.services.exercises import get_exercise, list_exercises

router = APIRouter(prefix="/api/v1/exercises", tags=["Exercises"])


@router.get(
    "",
    response_model=ExerciseListResponse,
    summary="Browse active exercise catalog",
)
async def list_exercises_endpoint(
    q: str | None = None,
    difficulty: str | None = None,
    equipment: str | None = None,
    muscle_group: str | None = None,
    updated_since: datetime | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    _current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ExerciseListResponse:
    return await list_exercises(
        session,
        q=q,
        difficulty=difficulty,
        equipment=equipment,
        muscle_group=muscle_group,
        updated_since=updated_since,
        limit=limit,
        cursor=cursor,
    )


@router.get(
    "/{exercise_id}",
    response_model=ExerciseResponse,
    summary="Read one exercise",
)
async def get_exercise_endpoint(
    exercise_id: UUID,
    _current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ExerciseResponse:
    return await get_exercise(session, exercise_id=exercise_id)
