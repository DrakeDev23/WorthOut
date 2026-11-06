from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


async def get_user_by_clerk_id(
    session: AsyncSession, clerk_user_id: str
) -> User | None:
    return await session.scalar(
        select(User).where(
            User.clerk_user_id == clerk_user_id, User.deleted_at.is_(None)
        )
    )


async def get_or_provision_user(
    session: AsyncSession,
    *,
    clerk_user_id: str,
    email: str | None = None,
    display_name: str | None = None,
) -> User:
    """Resolve the internal user for a verified Clerk subject.

    Concurrent first-login races are handled via the unique clerk_user_id
    constraint and a savepoint retry that reloads the winning row.
    """
    existing = await get_user_by_clerk_id(session, clerk_user_id)
    if existing is not None:
        return existing

    candidate = User(
        clerk_user_id=clerk_user_id,
        email=email,
        display_name=display_name,
    )
    try:
        async with session.begin_nested():
            session.add(candidate)
            await session.flush()
    except IntegrityError:
        existing = await get_user_by_clerk_id(session, clerk_user_id)
        if existing is None:
            raise
        return existing

    return candidate
