from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import forbidden
from app.models import User


async def get_user_by_clerk_id(
    session: AsyncSession,
    clerk_user_id: str,
    *,
    include_deleted: bool = False,
) -> User | None:
    query = select(User).where(User.clerk_user_id == clerk_user_id)
    if not include_deleted:
        query = query.where(User.deleted_at.is_(None))
    return await session.scalar(query)


async def get_or_provision_user(
    session: AsyncSession,
    *,
    clerk_user_id: str,
    email: str | None = None,
    display_name: str | None = None,
    allow_deleted: bool = False,
) -> User:
    """Resolve the internal user for a verified Clerk subject.

    Concurrent first-login races are handled via the unique clerk_user_id
    constraint and a savepoint retry that reloads the winning row.
    Soft-deleted accounts are rejected unless allow_deleted=True.
    """
    existing = await get_user_by_clerk_id(session, clerk_user_id, include_deleted=True)
    if existing is not None:
        if existing.deleted_at is not None and not allow_deleted:
            raise forbidden("Account has been deleted.")
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
        existing = await get_user_by_clerk_id(
            session, clerk_user_id, include_deleted=True
        )
        if existing is None:
            raise
        if existing.deleted_at is not None and not allow_deleted:
            raise forbidden("Account has been deleted.")
        return existing

    return candidate
