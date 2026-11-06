from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clerk_jwt import verify_clerk_bearer_token
from app.core.errors import service_unavailable, unauthorized
from app.db.session import get_db_session
from app.models import User
from app.services.users import get_or_provision_user

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> str:
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not credentials.credentials
    ):
        raise unauthorized("Missing Bearer token.")
    token = credentials.credentials.strip()
    if not token or token.count(".") != 2:
        raise unauthorized("Malformed Bearer token.")
    return token


async def get_current_user(
    token: str = Depends(get_bearer_token),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    """Authenticate via Clerk JWT and resolve the internal user record.

    Identity is derived only from the verified JWT `sub` claim. Client-supplied
    user identifiers are never trusted.
    """
    claims = await verify_clerk_bearer_token(token)
    try:
        return await get_or_provision_user(
            session,
            clerk_user_id=claims.sub,
            email=claims.email,
            display_name=claims.display_name,
        )
    except SQLAlchemyError as exc:
        raise service_unavailable("Unable to resolve authenticated user.") from exc
