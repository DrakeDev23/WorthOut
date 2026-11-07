from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user
from app.models.entities import User
from app.schemas.routines import (
    RoutineCreate,
    RoutineListResponse,
    RoutineResponse,
    RoutineUpdate,
)
from app.services.routines import (
    create_routine,
    delete_routine,
    get_routine,
    list_routines,
    update_routine,
)

router = APIRouter(prefix="/api/v1/routines", tags=["Routines"])


@router.get(
    "",
    response_model=RoutineListResponse,
    summary="List owned routines",
)
async def list_routines_endpoint(
    include_deleted: bool = False,
    updated_since: datetime | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> RoutineListResponse:
    return await list_routines(
        session,
        user_id=current_user.id,
        include_deleted=include_deleted,
        updated_since=updated_since,
        limit=limit,
        cursor=cursor,
    )


@router.post(
    "",
    response_model=RoutineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a routine aggregate",
)
async def create_routine_endpoint(
    data: RoutineCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> RoutineResponse:
    return await create_routine(
        session,
        user_id=current_user.id,
        data=data,
    )


@router.get(
    "/{routine_id}",
    response_model=RoutineResponse,
    summary="Read one owned routine",
)
async def get_routine_endpoint(
    routine_id: UUID,
    include_deleted: bool = False,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> RoutineResponse:
    return await get_routine(
        session,
        user_id=current_user.id,
        routine_id=routine_id,
        include_deleted=include_deleted,
    )


@router.patch(
    "/{routine_id}",
    response_model=RoutineResponse,
    summary="Update one routine aggregate",
)
async def update_routine_endpoint(
    routine_id: UUID,
    data: RoutineUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> RoutineResponse:
    return await update_routine(
        session,
        user_id=current_user.id,
        routine_id=routine_id,
        data=data,
    )


@router.delete(
    "/{routine_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a routine aggregate",
)
async def delete_routine_endpoint(
    routine_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    await delete_routine(
        session,
        user_id=current_user.id,
        routine_id=routine_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
