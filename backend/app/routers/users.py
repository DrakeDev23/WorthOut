from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.models import User
from app.schemas.users import UserMeResponse

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get(
    "/me", response_model=UserMeResponse, summary="Get current authenticated user"
)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
