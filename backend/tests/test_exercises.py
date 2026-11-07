from __future__ import annotations

import uuid

import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.entities import (
    Equipment,
    Exercise,
    ExerciseEquipment,
    ExerciseMuscleGroup,
    MuscleGroup,
)
from tests.jwt_helpers import mint_token


@pytest.fixture
async def seed_exercises(
    db_session_factory: async_sessionmaker[AsyncSession],
) -> dict[str, uuid.UUID]:
    ex1_id = uuid.uuid4()
    ex2_id = uuid.uuid4()
    ex_inactive_id = uuid.uuid4()
    eq_id = uuid.uuid4()
    mg_id = uuid.uuid4()

    async with db_session_factory() as session:
        eq = Equipment(id=eq_id, name=f"Dumbbell-{eq_id}")
        mg = MuscleGroup(id=mg_id, name=f"Chest-{mg_id}")
        session.add_all([eq, mg])
        await session.flush()

        ex1 = Exercise(
            id=ex1_id,
            name=f"Bench Press-{ex1_id}",
            description="Compound chest exercise",
            instructions=["Lie down", "Press up"],
            tips=["Keep wrists straight"],
            difficulty="intermediate",
            tracking_type="weight_reps",
            default_sets=3,
            default_reps=10,
            default_rest_seconds=90,
            accent_color="#FF0000",
            is_active=True,
        )
        ex2 = Exercise(
            id=ex2_id,
            name=f"Push-up-{ex2_id}",
            description="Bodyweight exercise",
            instructions=["Plank position", "Push up"],
            difficulty="beginner",
            tracking_type="reps",
            default_sets=3,
            default_reps=15,
            is_active=True,
        )
        ex_inactive = Exercise(
            id=ex_inactive_id,
            name=f"Old Exercise-{ex_inactive_id}",
            difficulty="advanced",
            tracking_type="reps",
            is_active=False,
        )
        session.add_all([ex1, ex2, ex_inactive])
        await session.flush()

        ee = ExerciseEquipment(exercise_id=ex1_id, equipment_id=eq_id)
        emg = ExerciseMuscleGroup(
            exercise_id=ex1_id, muscle_group_id=mg_id, is_primary=True
        )
        session.add_all([ee, emg])
        await session.commit()

    yield {
        "ex1_id": ex1_id,
        "ex2_id": ex2_id,
        "inactive_id": ex_inactive_id,
        "eq_name": f"Dumbbell-{eq_id}",
        "mg_name": f"Chest-{mg_id}",
    }

    async with db_session_factory() as session:
        await session.execute(
            delete(ExerciseEquipment).where(ExerciseEquipment.exercise_id == ex1_id)
        )
        await session.execute(
            delete(ExerciseMuscleGroup).where(ExerciseMuscleGroup.exercise_id == ex1_id)
        )
        await session.execute(
            delete(Exercise).where(Exercise.id.in_([ex1_id, ex2_id, ex_inactive_id]))
        )
        await session.execute(delete(Equipment).where(Equipment.id == eq_id))
        await session.execute(delete(MuscleGroup).where(MuscleGroup.id == mg_id))
        await session.commit()


@pytest.mark.asyncio
async def test_list_exercises_requires_auth(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
) -> None:
    client, _, _ = api_client
    response = await client.get("/api/v1/exercises")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


@pytest.mark.asyncio
async def test_list_exercises_returns_active_catalog(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_exercises: dict[str, uuid.UUID],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, sub="clerk_test_ex_user")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/v1/exercises", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    ids = [item["id"] for item in data["items"]]
    assert str(seed_exercises["ex1_id"]) in ids
    assert str(seed_exercises["ex2_id"]) in ids
    # Inactive exercise must not be listed
    assert str(seed_exercises["inactive_id"]) not in ids


@pytest.mark.asyncio
async def test_list_exercises_filters(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_exercises: dict[str, uuid.UUID],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, sub="clerk_test_ex_user")
    headers = {"Authorization": f"Bearer {token}"}

    # Filter by q
    res_q = await client.get(
        "/api/v1/exercises",
        params={"q": str(seed_exercises["ex1_id"])},
        headers=headers,
    )
    assert res_q.status_code == 200
    items_q = res_q.json()["items"]
    assert len(items_q) == 1
    assert items_q[0]["id"] == str(seed_exercises["ex1_id"])

    # Filter by difficulty
    res_diff = await client.get(
        "/api/v1/exercises",
        params={"difficulty": "intermediate"},
        headers=headers,
    )
    assert res_diff.status_code == 200
    diff_ids = [item["id"] for item in res_diff.json()["items"]]
    assert str(seed_exercises["ex1_id"]) in diff_ids
    assert str(seed_exercises["ex2_id"]) not in diff_ids

    # Filter by equipment
    res_eq = await client.get(
        "/api/v1/exercises",
        params={"equipment": seed_exercises["eq_name"]},
        headers=headers,
    )
    assert res_eq.status_code == 200
    eq_ids = [item["id"] for item in res_eq.json()["items"]]
    assert str(seed_exercises["ex1_id"]) in eq_ids

    # Filter by muscle group
    res_mg = await client.get(
        "/api/v1/exercises",
        params={"muscle_group": seed_exercises["mg_name"]},
        headers=headers,
    )
    assert res_mg.status_code == 200
    mg_ids = [item["id"] for item in res_mg.json()["items"]]
    assert str(seed_exercises["ex1_id"]) in mg_ids


@pytest.mark.asyncio
async def test_list_exercises_cursor_pagination(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_exercises: dict[str, uuid.UUID],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, sub="clerk_test_ex_user")
    headers = {"Authorization": f"Bearer {token}"}

    res_page1 = await client.get(
        "/api/v1/exercises", params={"limit": 1}, headers=headers
    )
    assert res_page1.status_code == 200
    page1_data = res_page1.json()
    assert len(page1_data["items"]) == 1
    cursor = page1_data["next_cursor"]
    assert cursor is not None

    res_page2 = await client.get(
        "/api/v1/exercises",
        params={"limit": 1, "cursor": cursor},
        headers=headers,
    )
    assert res_page2.status_code == 200
    page2_data = res_page2.json()
    assert len(page2_data["items"]) == 1
    assert page2_data["items"][0]["id"] != page1_data["items"][0]["id"]


@pytest.mark.asyncio
async def test_get_exercise_details_and_errors(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_exercises: dict[str, uuid.UUID],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, sub="clerk_test_ex_user")
    headers = {"Authorization": f"Bearer {token}"}

    # Successful read
    res = await client.get(
        f"/api/v1/exercises/{seed_exercises['ex1_id']}", headers=headers
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload["id"] == str(seed_exercises["ex1_id"])
    assert len(payload["equipment"]) == 1
    assert payload["equipment"][0]["name"] == seed_exercises["eq_name"]
    assert len(payload["muscle_groups"]) == 1
    assert payload["muscle_groups"][0]["name"] == seed_exercises["mg_name"]
    assert payload["muscle_groups"][0]["is_primary"] is True

    # Inactive exercise returns 404
    res_inactive = await client.get(
        f"/api/v1/exercises/{seed_exercises['inactive_id']}", headers=headers
    )
    assert res_inactive.status_code == 404
    assert res_inactive.json()["error"]["code"] == "not_found"

    # Unknown UUID returns 404
    unknown_id = uuid.uuid4()
    res_unknown = await client.get(f"/api/v1/exercises/{unknown_id}", headers=headers)
    assert res_unknown.status_code == 404

    # Malformed ID returns 422
    res_bad = await client.get("/api/v1/exercises/not-a-uuid", headers=headers)
    assert res_bad.status_code == 422
    assert res_bad.json()["error"]["code"] == "validation_error"
