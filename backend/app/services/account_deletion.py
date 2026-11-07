from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any
from uuid import UUID, uuid4

import httpx
from fastapi import BackgroundTasks
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.entities import User

logger = logging.getLogger(__name__)

# Registry of deletion jobs: deletion_id -> job dict
_deletion_jobs: dict[UUID, dict[str, Any]] = {}
# Map user_id -> deletion_id for idempotency
_user_deletion_map: dict[UUID, UUID] = {}

# Test hook for mocking Clerk user deletion
_test_clerk_delete_handler: Callable[[str], Awaitable[bool]] | None = None


def set_clerk_delete_handler_for_tests(
    handler: Callable[[str], Awaitable[bool]] | None,
) -> None:
    global _test_clerk_delete_handler
    _test_clerk_delete_handler = handler


def get_deletion_job(deletion_id: UUID) -> dict[str, Any] | None:
    return _deletion_jobs.get(deletion_id)


def reset_deletion_state_for_tests() -> None:
    global _deletion_jobs, _user_deletion_map, _test_clerk_delete_handler
    _deletion_jobs.clear()
    _user_deletion_map.clear()
    _test_clerk_delete_handler = None


async def delete_clerk_user(
    clerk_user_id: str, *, secret_key: str | None = None
) -> bool:
    """Initiate deletion of a user from Clerk via Backend API."""
    key = secret_key or settings.CLERK_SECRET_KEY
    if not key:
        logger.warning(
            "CLERK_SECRET_KEY not configured; skipping external Clerk deletion."
        )
        return True

    url = f"https://api.clerk.com/v1/users/{clerk_user_id}"
    headers = {"Authorization": f"Bearer {key}"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.delete(url, headers=headers)
        if resp.status_code in (200, 404):
            return True
        resp.raise_for_status()
        return True


async def process_account_deletion(
    *,
    user_id: UUID,
    clerk_user_id: str,
    deletion_id: UUID,
    session_factory: async_sessionmaker[AsyncSession] | None = None,
    clerk_delete_fn: Callable[[str], Awaitable[bool]] | None = None,
    max_retries: int = 3,
    retry_delay: float = 0.05,
) -> None:
    """Background worker task for asynchronous account deletion.

    Separates Clerk deletion and PostgreSQL deletion safely:
    1. Retries external Clerk deletion upon failure.
    2. Purges PostgreSQL data independently via cascading delete.
    """
    job = _deletion_jobs.get(deletion_id)
    if job is None:
        job = {
            "deletion_id": deletion_id,
            "user_id": user_id,
            "clerk_user_id": clerk_user_id,
            "status": "pending",
            "attempts": 0,
        }
        _deletion_jobs[deletion_id] = job

    # 1. Clerk deletion with retries
    clerk_success = False
    delete_func = clerk_delete_fn or _test_clerk_delete_handler or delete_clerk_user

    for attempt in range(1, max_retries + 1):
        job["attempts"] = attempt
        try:
            clerk_success = await delete_func(clerk_user_id)
            if clerk_success:
                break
        except Exception as exc:
            logger.warning(
                "Clerk deletion attempt %d/%d failed for user %s: %s",
                attempt,
                max_retries,
                clerk_user_id,
                exc,
            )
            if attempt < max_retries:
                await asyncio.sleep(retry_delay)
            else:
                job["status"] = "failed"
                job["error"] = str(exc)

    # 2. PostgreSQL data deletion:
    # Purge the user record from PostgreSQL, cascading all child rows
    factory = session_factory or AsyncSessionLocal
    try:
        async with factory() as session:
            user = await session.get(User, user_id)
            if user is not None:
                await session.delete(user)
                await session.commit()
        if clerk_success:
            job["status"] = "completed"
    except Exception as exc:
        logger.error("Failed to delete user %s from PostgreSQL: %s", user_id, exc)
        job["status"] = "failed"
        job["db_error"] = str(exc)


async def initiate_account_deletion(
    session: AsyncSession,
    user: User,
    *,
    background_tasks: BackgroundTasks | None = None,
    session_factory: async_sessionmaker[AsyncSession] | None = None,
) -> tuple[UUID, bool]:
    """Initiates account deletion for the authenticated user.

    Marks the account deleted_at in PostgreSQL to immediately prevent further access,
    and enqueues the background worker task. Idempotent for already-initiated deletions.
    """
    existing_id = _user_deletion_map.get(user.id)
    if existing_id is not None:
        return existing_id, False

    deletion_id = uuid4()
    _user_deletion_map[user.id] = deletion_id
    _deletion_jobs[deletion_id] = {
        "deletion_id": deletion_id,
        "user_id": user.id,
        "clerk_user_id": user.clerk_user_id,
        "status": "pending",
        "attempts": 0,
    }

    if user.deleted_at is None:
        user.deleted_at = func.now()
        await session.commit()

    if background_tasks is not None:
        background_tasks.add_task(
            process_account_deletion,
            user_id=user.id,
            clerk_user_id=user.clerk_user_id,
            deletion_id=deletion_id,
            session_factory=session_factory,
        )

    return deletion_id, True
