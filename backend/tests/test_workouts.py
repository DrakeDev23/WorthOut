from __future__ import annotations

import uuid

import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.entities import (
    Exercise,
    ExerciseSet,
    WorkoutExercise,
    WorkoutRoutine,
    WorkoutSession,
)
from tests.jwt_helpers import mint_token


@pytest.fixture
async def seed_workout_catalog(
    db_session_factory: async_sessionmaker[AsyncSession],
) -> dict[str, uuid.UUID]:
    ex1_id = uuid.uuid4()
    ex2_id = uuid.uuid4()

    async with db_session_factory() as session:
        ex1 = Exercise(
            id=ex1_id,
            name=f"Catalog Pushup-{ex1_id}",
            difficulty="beginner",
            tracking_type="reps",
            is_active=True,
        )
        ex2 = Exercise(
            id=ex2_id,
            name=f"Catalog Squat-{ex2_id}",
            difficulty="intermediate",
            tracking_type="weight_reps",
            is_active=True,
        )
        session.add_all([ex1, ex2])
        await session.commit()

    yield {
        "ex1_id": ex1_id,
        "ex2_id": ex2_id,
    }

    async with db_session_factory() as session:
        await session.execute(delete(ExerciseSet))
        await session.execute(delete(WorkoutExercise))
        await session.execute(delete(WorkoutSession))
        await session.execute(delete(WorkoutRoutine))
        await session.execute(delete(Exercise).where(Exercise.id.in_([ex1_id, ex2_id])))
        await session.commit()


@pytest.mark.asyncio
async def test_create_workout_success_and_validations(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_workout_catalog: dict[str, uuid.UUID],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, sub="clerk_workout_user_1")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Reject in_progress status with 422
    payload_in_progress = {
        "name": "Live Workout",
        "started_at": "2026-11-04T09:30:00Z",
        "status": "in_progress",
    }
    res_in_prog = await client.post(
        "/api/v1/workouts", json=payload_in_progress, headers=headers
    )
    assert res_in_prog.status_code == 422

    # 2. Reject non-existent exercise reference with 404
    payload_bad_ex = {
        "name": "Bad Exercise Workout",
        "started_at": "2026-11-04T09:30:00Z",
        "status": "completed",
        "exercises": [
            {
                "exercise_id": str(uuid.uuid4()),
                "position": 1,
                "sets": [{"set_number": 1, "repetitions": 10}],
            }
        ],
    }
    res_bad_ex = await client.post(
        "/api/v1/workouts", json=payload_bad_ex, headers=headers
    )
    assert res_bad_ex.status_code == 404
    assert res_bad_ex.json()["error"]["code"] == "not_found"

    # 3. Successful creation of completed workout aggregate
    custom_workout_id = str(uuid.uuid4())
    payload_ok = {
        "id": custom_workout_id,
        "name": "Morning Strength",
        "routine_name_snapshot": "Morning Strength",
        "started_at": "2026-11-04T09:00:00Z",
        "completed_at": "2026-11-04T09:45:00Z",
        "duration_seconds": 2700,
        "status": "completed",
        "notes": "Felt great today",
        "exercises": [
            {
                "exercise_id": str(seed_workout_catalog["ex1_id"]),
                "position": 1,
                "notes": "Focus on form",
                "sets": [
                    {
                        "set_number": 1,
                        "repetitions": 15,
                        "weight_kg": None,
                        "is_completed": True,
                    },
                    {
                        "set_number": 2,
                        "repetitions": 12,
                        "weight_kg": None,
                        "is_completed": True,
                    },
                ],
            },
            {
                "exercise_id": str(seed_workout_catalog["ex2_id"]),
                "position": 2,
                "sets": [
                    {
                        "set_number": 1,
                        "repetitions": 10,
                        "weight_kg": 60.0,
                        "is_completed": True,
                    }
                ],
            },
        ],
    }
    res_ok = await client.post("/api/v1/workouts", json=payload_ok, headers=headers)
    assert res_ok.status_code == 201
    created = res_ok.json()
    assert created["id"] == custom_workout_id
    assert created["name"] == "Morning Strength"
    assert created["routine_name_snapshot"] == "Morning Strength"
    assert created["status"] == "completed"
    assert len(created["exercises"]) == 2
    assert (
        created["exercises"][0]["exercise_name_snapshot"]
        == f"Catalog Pushup-{seed_workout_catalog['ex1_id']}"
    )
    assert len(created["exercises"][0]["sets"]) == 2
    assert created["exercises"][0]["sets"][0]["repetitions"] == 15
    assert float(created["exercises"][1]["sets"][0]["weight_kg"]) == 60.0

    # 4. Idempotent repeat returns existing representation
    res_repeat = await client.post("/api/v1/workouts", json=payload_ok, headers=headers)
    assert res_repeat.status_code in (200, 201)
    assert res_repeat.json()["id"] == custom_workout_id

    # 5. Reusing ID with different content returns 409 Conflict
    payload_conflict = dict(payload_ok)
    payload_conflict["name"] = "Conflicting Name"
    res_conflict = await client.post(
        "/api/v1/workouts", json=payload_conflict, headers=headers
    )
    assert res_conflict.status_code == 409
    assert res_conflict.json()["error"]["code"] == "conflict"


@pytest.mark.asyncio
async def test_workout_ownership_isolation_and_cross_user_attempts(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_workout_catalog: dict[str, uuid.UUID],
) -> None:
    client, private_key, _ = api_client
    token_user_a = mint_token(private_key, sub="clerk_workout_user_a")
    token_user_b = mint_token(private_key, sub="clerk_workout_user_b")
    headers_a = {"Authorization": f"Bearer {token_user_a}"}
    headers_b = {"Authorization": f"Bearer {token_user_b}"}

    # User A creates a routine
    res_routine = await client.post(
        "/api/v1/routines",
        json={
            "name": "User A Private Routine",
            "exercises": [
                {
                    "exercise_id": str(seed_workout_catalog["ex1_id"]),
                    "position": 1,
                    "target_sets": 3,
                    "target_reps": 10,
                }
            ],
        },
        headers=headers_a,
    )
    assert res_routine.status_code == 201
    routine_a_id = res_routine.json()["id"]

    # User B attempts to create a workout referencing User A's private routine -> must return 404
    res_b_bad_routine = await client.post(
        "/api/v1/workouts",
        json={
            "routine_id": routine_a_id,
            "name": "User B Workout with User A Routine",
            "started_at": "2026-11-04T10:00:00Z",
            "status": "completed",
            "exercises": [
                {
                    "exercise_id": str(seed_workout_catalog["ex1_id"]),
                    "position": 1,
                    "sets": [{"set_number": 1, "repetitions": 10}],
                }
            ],
        },
        headers=headers_b,
    )
    assert res_b_bad_routine.status_code == 404
    assert res_b_bad_routine.json()["error"]["code"] == "not_found"

    # User A creates a workout
    res_workout_a = await client.post(
        "/api/v1/workouts",
        json={
            "routine_id": routine_a_id,
            "name": "User A Completed Workout",
            "started_at": "2026-11-04T10:00:00Z",
            "status": "completed",
            "exercises": [
                {
                    "exercise_id": str(seed_workout_catalog["ex1_id"]),
                    "position": 1,
                    "sets": [{"set_number": 1, "repetitions": 10}],
                }
            ],
        },
        headers=headers_a,
    )
    assert res_workout_a.status_code == 201
    workout_a_id = res_workout_a.json()["id"]

    # User B lists workouts: User A's workout must NOT be in the list
    res_b_list = await client.get("/api/v1/workouts", headers=headers_b)
    assert res_b_list.status_code == 200
    b_ids = [w["id"] for w in res_b_list.json()["items"]]
    assert workout_a_id not in b_ids

    # User B attempts GET on User A's workout -> must return 404
    res_b_get = await client.get(f"/api/v1/workouts/{workout_a_id}", headers=headers_b)
    assert res_b_get.status_code == 404
    assert res_b_get.json()["error"]["code"] == "not_found"


@pytest.mark.asyncio
async def test_list_workouts_filters_and_pagination(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_workout_catalog: dict[str, uuid.UUID],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, sub="clerk_workout_filter_user")
    headers = {"Authorization": f"Bearer {token}"}

    # Create 2 workouts at different times
    w1_payload = {
        "name": "Workout Early",
        "started_at": "2026-11-01T08:00:00Z",
        "status": "completed",
        "exercises": [
            {
                "exercise_id": str(seed_workout_catalog["ex1_id"]),
                "position": 1,
                "sets": [{"set_number": 1, "repetitions": 10}],
            }
        ],
    }
    w2_payload = {
        "name": "Workout Late",
        "started_at": "2026-11-05T08:00:00Z",
        "status": "completed",
        "exercises": [
            {
                "exercise_id": str(seed_workout_catalog["ex2_id"]),
                "position": 1,
                "sets": [{"set_number": 1, "repetitions": 8}],
            }
        ],
    }
    await client.post("/api/v1/workouts", json=w1_payload, headers=headers)
    await client.post("/api/v1/workouts", json=w2_payload, headers=headers)

    # Filter with from
    res_from = await client.get(
        "/api/v1/workouts",
        params={"from": "2026-11-03T00:00:00Z"},
        headers=headers,
    )
    assert res_from.status_code == 200
    from_items = res_from.json()["items"]
    assert len(from_items) == 1
    assert from_items[0]["name"] == "Workout Late"

    # Pagination
    res_page1 = await client.get(
        "/api/v1/workouts", params={"limit": 1}, headers=headers
    )
    assert res_page1.status_code == 200
    page1 = res_page1.json()
    assert len(page1["items"]) == 1
    assert page1["items"][0]["name"] == "Workout Late"  # started_at DESC
    cursor = page1["next_cursor"]
    assert cursor is not None

    res_page2 = await client.get(
        "/api/v1/workouts",
        params={"limit": 1, "cursor": cursor},
        headers=headers,
    )
    assert res_page2.status_code == 200
    page2 = res_page2.json()
    assert len(page2["items"]) == 1
    assert page2["items"][0]["name"] == "Workout Early"
