from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user
from app.models.entities import User
from app.schemas.workouts import (
    WorkoutCreate,
    WorkoutListResponse,
    WorkoutResponse,
)
from app.services.workouts import create_workout, get_workout, list_workouts

router = APIRouter(prefix="/api/v1/workouts", tags=["Workouts"])


@router.get(
    "",
    response_model=WorkoutListResponse,
    summary="List completed workout history",
)
async def list_workouts_endpoint(
    from_time: datetime | None = Query(default=None, alias="from"),
    to_time: datetime | None = Query(default=None, alias="to"),
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> WorkoutListResponse:
    return await list_workouts(
        session,
        user_id=current_user.id,
        from_time=from_time,
        to_time=to_time,
        limit=limit,
        cursor=cursor,
    )


@router.post(
    "",
    response_model=WorkoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a completed workout snapshot",
)
async def create_workout_endpoint(
    data: WorkoutCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> WorkoutResponse:
    return await create_workout(
        session,
        user_id=current_user.id,
        data=data,
    )


@router.get(
    "/{workout_id}",
    response_model=WorkoutResponse,
    summary="Read one completed workout",
)
async def get_workout_endpoint(
    workout_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> WorkoutResponse:
    return await get_workout(
        session,
        user_id=current_user.id,
        workout_id=workout_id,
    )
