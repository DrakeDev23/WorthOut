from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.dependencies.auth import (
    get_current_user,
    get_current_user_allow_deleted,
)
from app.models import User
from app.schemas.users import UserDeletionResponse, UserMeResponse
from app.services.account_deletion import initiate_account_deletion

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Get current authenticated user",
)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.delete(
    "/me",
    response_model=UserDeletionResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start asynchronous account deletion",
)
async def delete_me(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user_allow_deleted),
    session: AsyncSession = Depends(get_db_session),
) -> UserDeletionResponse:
    deletion_id, _is_new = await initiate_account_deletion(
        session, current_user, background_tasks=background_tasks
    )
    return UserDeletionResponse(deletion_id=deletion_id, status="pending")
