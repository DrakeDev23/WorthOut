from __future__ import annotations

import asyncio
import os
import uuid
from collections.abc import AsyncIterator

import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.clerk_jwt import ClerkJwtVerifier
from app.db.session import get_db_session
from app.main import app
from app.models import User, WorkoutRoutine
from app.services.ownership import OwnershipViolation, require_owned_routine
from app.services.users import get_or_provision_user
from tests.jwt_helpers import mint_token

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")


@pytest.fixture
async def db_session_factory() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    if not TEST_DATABASE_URL:
        pytest.skip(
            "TEST_DATABASE_URL is required for PostgreSQL auth integration tests"
        )
    engine = create_async_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    yield factory
    await engine.dispose()


@pytest.fixture
async def api_client(
    configured_verifier: tuple[ClerkJwtVerifier, rsa.RSAPrivateKey],
    db_session_factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[
    tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]]
]:
    _verifier, private_key = configured_verifier

    async def override_db() -> AsyncIterator[AsyncSession]:
        async with db_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db_session] = override_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, private_key, db_session_factory
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_missing_token_returns_401(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, _, _ = api_client
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401
    body = response.json()
    assert body["error"]["code"] == "unauthorized"


@pytest.mark.asyncio
async def test_malformed_token_returns_401(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, _, _ = api_client
    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": "Bearer not-a-jwt"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_invalid_signature_returns_401(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, _, _ = api_client
    attacker_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    token = mint_token(attacker_key)
    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_expired_token_returns_401(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, exp_delta=-30)
    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401
    assert "expired" in response.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_invalid_issuer_returns_401(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, issuer="https://attacker.example")
    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_invalid_audience_returns_401(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, audience="wrong-audience")
    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_valid_token_provisions_new_user(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, private_key, factory = api_client
    clerk_id = f"user_new_{uuid.uuid4()}"
    token = mint_token(
        private_key,
        sub=clerk_id,
        extra_claims={"email": "new@example.com", "name": "New User"},
    )
    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["clerk_user_id"] == clerk_id
    assert payload["email"] == "new@example.com"
    assert payload["display_name"] == "New User"
    assert payload["id"]
    assert set(payload) == {
        "id",
        "clerk_user_id",
        "display_name",
        "email",
        "created_at",
        "updated_at",
    }

    async with factory() as session:
        stored = await session.scalar(
            select(User).where(User.clerk_user_id == clerk_id)
        )
        assert stored is not None
        assert str(stored.id) == payload["id"]
        await session.execute(delete(User).where(User.clerk_user_id == clerk_id))
        await session.commit()


@pytest.mark.asyncio
async def test_valid_token_resolves_existing_user(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, private_key, factory = api_client
    clerk_id = f"user_existing_{uuid.uuid4()}"
    user_id = uuid.uuid4()
    async with factory() as session:
        session.add(
            User(
                id=user_id,
                clerk_user_id=clerk_id,
                email="existing@example.com",
                display_name="Existing",
            )
        )
        await session.commit()

    token = mint_token(private_key, sub=clerk_id)
    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == str(user_id)
    assert payload["clerk_user_id"] == clerk_id
    assert payload["email"] == "existing@example.com"

    async with factory() as session:
        count = len(
            (
                await session.scalars(
                    select(User).where(User.clerk_user_id == clerk_id)
                )
            ).all()
        )
        assert count == 1
        await session.execute(delete(User).where(User.id == user_id))
        await session.commit()


@pytest.mark.asyncio
async def test_client_supplied_user_id_is_ignored(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, private_key, factory = api_client
    clerk_id = f"user_ignore_{uuid.uuid4()}"
    other_id = uuid.uuid4()
    token = mint_token(private_key, sub=clerk_id)
    response = await client.get(
        f"/api/v1/users/me?user_id={other_id}",
        headers={"Authorization": f"Bearer {token}", "X-User-Id": str(other_id)},
    )
    assert response.status_code == 200
    assert response.json()["clerk_user_id"] == clerk_id
    assert response.json()["id"] != str(other_id)

    async with factory() as session:
        await session.execute(delete(User).where(User.clerk_user_id == clerk_id))
        await session.commit()


@pytest.mark.asyncio
async def test_concurrent_first_login_provisions_single_user(
    db_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    clerk_id = f"user_race_{uuid.uuid4()}"

    async def provision_once() -> uuid.UUID:
        async with db_session_factory() as session:
            user = await get_or_provision_user(session, clerk_user_id=clerk_id)
            await session.commit()
            return user.id

    results = await asyncio.gather(*(provision_once() for _ in range(8)))
    assert len(set(results)) == 1

    async with db_session_factory() as session:
        users = (
            await session.scalars(select(User).where(User.clerk_user_id == clerk_id))
        ).all()
        assert len(users) == 1
        await session.execute(delete(User).where(User.clerk_user_id == clerk_id))
        await session.commit()


@pytest.mark.asyncio
async def test_authenticated_user_ownership_isolation(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, private_key, factory = api_client
    clerk_a = f"user_own_a_{uuid.uuid4()}"
    clerk_b = f"user_own_b_{uuid.uuid4()}"
    user_a_id = uuid.uuid4()
    user_b_id = uuid.uuid4()
    routine_id = uuid.uuid4()

    async with factory() as session:
        session.add_all(
            [
                User(id=user_a_id, clerk_user_id=clerk_a, display_name="A"),
                User(id=user_b_id, clerk_user_id=clerk_b, display_name="B"),
                WorkoutRoutine(id=routine_id, user_id=user_a_id, name="A private"),
            ]
        )
        await session.commit()

    token_b = mint_token(private_key, sub=clerk_b)
    me = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token_b}"}
    )
    assert me.status_code == 200
    assert me.json()["id"] == str(user_b_id)
    assert me.json()["clerk_user_id"] == clerk_b

    async with factory() as session:
        with pytest.raises(OwnershipViolation):
            await require_owned_routine(
                session, user_id=user_b_id, routine_id=routine_id
            )
        await session.execute(
            delete(WorkoutRoutine).where(WorkoutRoutine.id == routine_id)
        )
        await session.execute(delete(User).where(User.id.in_([user_a_id, user_b_id])))
        await session.commit()
