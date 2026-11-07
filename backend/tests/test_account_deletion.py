from __future__ import annotations

import uuid

import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.entities import User, WorkoutRoutine
from app.services.account_deletion import (
    get_deletion_job,
    process_account_deletion,
    reset_deletion_state_for_tests,
)
from tests.jwt_helpers import mint_token


@pytest.fixture(autouse=True)
def clean_deletion_state() -> None:
    reset_deletion_state_for_tests()
    yield
    reset_deletion_state_for_tests()


@pytest.mark.asyncio
async def test_delete_user_me_initiates_asynchronous_deletion(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, private_key, factory = api_client
    clerk_id = f"clerk_del_{uuid.uuid4().hex[:8]}"
    token = mint_token(private_key, sub=clerk_id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Provision user via GET /api/v1/users/me
    res_get = await client.get("/api/v1/users/me", headers=headers)
    assert res_get.status_code == 200
    user_id = uuid.UUID(res_get.json()["id"])

    # 2. Call DELETE /api/v1/users/me
    res_del = await client.delete("/api/v1/users/me", headers=headers)
    assert res_del.status_code == 202
    body = res_del.json()
    assert "deletion_id" in body
    assert body["status"] == "pending"
    deletion_id = uuid.UUID(body["deletion_id"])

    # 3. Check user immediately marked deleted_at in PostgreSQL
    async with factory() as session:
        user_row = await session.scalar(select(User).where(User.id == user_id))
        assert user_row is not None
        assert user_row.deleted_at is not None

    # 4. Subsequent requests by the deleted user must be blocked (403 Forbidden)
    res_blocked = await client.get("/api/v1/users/me", headers=headers)
    assert res_blocked.status_code == 403
    assert res_blocked.json()["error"]["code"] == "forbidden"

    # 5. Idempotent repeat: calling DELETE /api/v1/users/me again returns 202 with same deletion_id
    res_repeat = await client.delete("/api/v1/users/me", headers=headers)
    assert res_repeat.status_code == 202
    assert res_repeat.json()["deletion_id"] == str(deletion_id)


@pytest.mark.asyncio
async def test_account_deletion_user_isolation(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, private_key, factory = api_client
    user_a_clerk = f"clerk_a_{uuid.uuid4().hex[:8]}"
    user_b_clerk = f"clerk_b_{uuid.uuid4().hex[:8]}"

    token_a = mint_token(private_key, sub=user_a_clerk)
    token_b = mint_token(private_key, sub=user_b_clerk)

    # Provision both
    await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token_a}"}
    )
    res_b = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token_b}"}
    )
    user_b_id = uuid.UUID(res_b.json()["id"])

    # User A initiates deletion
    res_del_a = await client.delete(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_del_a.status_code == 202

    # User A is blocked
    res_check_a = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_check_a.status_code == 403

    # User B remains active and unaffected
    res_check_b = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_check_b.status_code == 200
    assert res_check_b.json()["id"] == str(user_b_id)


@pytest.mark.asyncio
async def test_process_account_deletion_cascades_and_retries(
    db_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user_id = uuid.uuid4()
    clerk_id = f"clerk_worker_{uuid.uuid4().hex[:8]}"
    deletion_id = uuid.uuid4()
    routine_id = uuid.uuid4()

    # Create user with a routine in PostgreSQL
    async with db_session_factory() as session:
        user = User(id=user_id, clerk_user_id=clerk_id)
        session.add(user)
        await session.flush()

        routine = WorkoutRoutine(id=routine_id, user_id=user_id, name="User Routine")
        session.add(routine)
        await session.commit()

    # Track Clerk delete attempts
    attempts = 0

    async def flaky_clerk_delete(cid: str) -> bool:
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise RuntimeError("Temporary network timeout")
        return True

    # Process deletion with flaky Clerk
    await process_account_deletion(
        user_id=user_id,
        clerk_user_id=clerk_id,
        deletion_id=deletion_id,
        session_factory=db_session_factory,
        clerk_delete_fn=flaky_clerk_delete,
        max_retries=3,
        retry_delay=0.01,
    )

    assert attempts == 3
    job = get_deletion_job(deletion_id)
    assert job is not None
    assert job["status"] == "completed"

    # PostgreSQL user and cascading routine are deleted
    async with db_session_factory() as session:
        user_in_db = await session.get(User, user_id)
        assert user_in_db is None
        routine_in_db = await session.get(WorkoutRoutine, routine_id)
        assert routine_in_db is None


@pytest.mark.asyncio
async def test_process_account_deletion_clerk_failure_resilience(
    db_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user_id = uuid.uuid4()
    clerk_id = f"clerk_fail_{uuid.uuid4().hex[:8]}"
    deletion_id = uuid.uuid4()

    async with db_session_factory() as session:
        user = User(id=user_id, clerk_user_id=clerk_id)
        session.add(user)
        await session.commit()

    async def permanently_failing_clerk(_cid: str) -> bool:
        raise ConnectionError("Clerk API permanently unreachable")

    await process_account_deletion(
        user_id=user_id,
        clerk_user_id=clerk_id,
        deletion_id=deletion_id,
        session_factory=db_session_factory,
        clerk_delete_fn=permanently_failing_clerk,
        max_retries=2,
        retry_delay=0.01,
    )

    job = get_deletion_job(deletion_id)
    assert job is not None
    assert job["status"] == "failed"
    assert "Clerk API permanently unreachable" in job["error"]

    # Even though Clerk failed, PostgreSQL deletion purged the user
    async with db_session_factory() as session:
        user_in_db = await session.get(User, user_id)
        assert user_in_db is None
