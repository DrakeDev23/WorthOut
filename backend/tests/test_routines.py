from __future__ import annotations

import uuid

import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.entities import Exercise, RoutineExercise, WorkoutRoutine
from tests.jwt_helpers import mint_token


@pytest.fixture
async def seed_exercise_catalog(
    db_session_factory: async_sessionmaker[AsyncSession],
) -> dict[str, uuid.UUID]:
    ex_rep_id = uuid.uuid4()
    ex_dur_id = uuid.uuid4()
    ex_inactive_id = uuid.uuid4()

    async with db_session_factory() as session:
        ex1 = Exercise(
            id=ex_rep_id,
            name=f"Rep Exercise-{ex_rep_id}",
            difficulty="beginner",
            tracking_type="reps",
            is_active=True,
        )
        ex2 = Exercise(
            id=ex_dur_id,
            name=f"Plank Exercise-{ex_dur_id}",
            difficulty="intermediate",
            tracking_type="duration",
            is_active=True,
        )
        ex3 = Exercise(
            id=ex_inactive_id,
            name=f"Inactive Exercise-{ex_inactive_id}",
            difficulty="advanced",
            tracking_type="reps",
            is_active=False,
        )
        session.add_all([ex1, ex2, ex3])
        await session.commit()

    yield {
        "rep_id": ex_rep_id,
        "dur_id": ex_dur_id,
        "inactive_id": ex_inactive_id,
    }

    async with db_session_factory() as session:
        await session.execute(delete(RoutineExercise))
        await session.execute(delete(WorkoutRoutine))
        await session.execute(
            delete(Exercise).where(
                Exercise.id.in_([ex_rep_id, ex_dur_id, ex_inactive_id])
            )
        )
        await session.commit()


@pytest.mark.asyncio
async def test_create_routine_success_and_validations(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_exercise_catalog: dict[str, uuid.UUID],
) -> None:
    client, private_key, factory = api_client
    token = mint_token(private_key, sub="clerk_routine_user_1")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Non-contiguous positions should fail with 422
    payload_bad_pos = {
        "name": "Invalid Positions",
        "exercises": [
            {
                "exercise_id": str(seed_exercise_catalog["rep_id"]),
                "position": 1,
                "target_sets": 3,
                "target_reps": 10,
            },
            {
                "exercise_id": str(seed_exercise_catalog["dur_id"]),
                "position": 3,  # skipped 2
                "target_sets": 3,
                "target_duration_seconds": 60,
            },
        ],
    }
    res_bad_pos = await client.post(
        "/api/v1/routines", json=payload_bad_pos, headers=headers
    )
    assert res_bad_pos.status_code == 422
    assert res_bad_pos.json()["error"]["code"] == "validation_error"

    # 2. Inactive exercise reference should return 404
    payload_inactive_ex = {
        "name": "With Inactive Exercise",
        "exercises": [
            {
                "exercise_id": str(seed_exercise_catalog["inactive_id"]),
                "position": 1,
                "target_sets": 3,
                "target_reps": 10,
            }
        ],
    }
    res_inactive = await client.post(
        "/api/v1/routines", json=payload_inactive_ex, headers=headers
    )
    assert res_inactive.status_code == 404
    assert res_inactive.json()["error"]["code"] == "not_found"

    # 3. Missing required target_duration_seconds for duration exercise should return 422
    payload_missing_field = {
        "name": "Missing Duration",
        "exercises": [
            {
                "exercise_id": str(seed_exercise_catalog["dur_id"]),
                "position": 1,
                "target_sets": 3,
                # target_duration_seconds omitted
            }
        ],
    }
    res_missing = await client.post(
        "/api/v1/routines", json=payload_missing_field, headers=headers
    )
    assert res_missing.status_code == 422

    # 4. Successful creation
    custom_routine_id = str(uuid.uuid4())
    payload_ok = {
        "id": custom_routine_id,
        "name": "Full Body Starter",
        "description": "Beginner routine",
        "category": "Full Body",
        "exercises": [
            {
                "exercise_id": str(seed_exercise_catalog["rep_id"]),
                "position": 1,
                "target_sets": 3,
                "target_reps": 12,
                "weight_kg": 20.5,
                "rest_seconds": 60,
            },
            {
                "exercise_id": str(seed_exercise_catalog["dur_id"]),
                "position": 2,
                "target_sets": 2,
                "target_duration_seconds": 45,
                "rest_seconds": 30,
            },
        ],
    }
    res_ok = await client.post("/api/v1/routines", json=payload_ok, headers=headers)
    assert res_ok.status_code == 201
    created = res_ok.json()
    assert created["id"] == custom_routine_id
    assert created["name"] == "Full Body Starter"
    assert created["version"] == 1
    assert len(created["exercises"]) == 2
    assert created["exercises"][0]["position"] == 1
    assert created["exercises"][0]["target_reps"] == 12
    assert float(created["exercises"][0]["weight_kg"]) == 20.5

    # 5. Reusing the exact same ID returns 409 Conflict
    res_dup = await client.post("/api/v1/routines", json=payload_ok, headers=headers)
    assert res_dup.status_code == 409
    assert res_dup.json()["error"]["code"] == "conflict"


@pytest.mark.asyncio
async def test_routine_ownership_isolation_and_cross_user_attempts(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_exercise_catalog: dict[str, uuid.UUID],
) -> None:
    client, private_key, _ = api_client
    token_user_a = mint_token(private_key, sub="clerk_user_a")
    token_user_b = mint_token(private_key, sub="clerk_user_b")
    headers_a = {"Authorization": f"Bearer {token_user_a}"}
    headers_b = {"Authorization": f"Bearer {token_user_b}"}

    # User A creates a routine
    res_create = await client.post(
        "/api/v1/routines",
        json={
            "name": "User A Private Routine",
            "exercises": [
                {
                    "exercise_id": str(seed_exercise_catalog["rep_id"]),
                    "position": 1,
                    "target_sets": 3,
                    "target_reps": 10,
                }
            ],
        },
        headers=headers_a,
    )
    assert res_create.status_code == 201
    routine_a_id = res_create.json()["id"]

    # User B list routines: must NOT see User A's routine
    res_b_list = await client.get("/api/v1/routines", headers=headers_b)
    assert res_b_list.status_code == 200
    b_ids = [r["id"] for r in res_b_list.json()["items"]]
    assert routine_a_id not in b_ids

    # User B GET User A's routine: must return 404
    res_b_get = await client.get(f"/api/v1/routines/{routine_a_id}", headers=headers_b)
    assert res_b_get.status_code == 404
    assert res_b_get.json()["error"]["code"] == "not_found"

    # User B PATCH User A's routine: must return 404
    res_b_patch = await client.patch(
        f"/api/v1/routines/{routine_a_id}",
        json={"base_version": 1, "name": "Hacked Routine"},
        headers=headers_b,
    )
    assert res_b_patch.status_code == 404

    # User B DELETE User A's routine: must return 404
    res_b_delete = await client.delete(
        f"/api/v1/routines/{routine_a_id}", headers=headers_b
    )
    assert res_b_delete.status_code == 404


@pytest.mark.asyncio
async def test_patch_routine_optimistic_concurrency_and_child_replacement(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_exercise_catalog: dict[str, uuid.UUID],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, sub="clerk_routine_patch_user")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create initial routine with 2 exercises
    res_create = await client.post(
        "/api/v1/routines",
        json={
            "name": "Versioned Routine",
            "exercises": [
                {
                    "exercise_id": str(seed_exercise_catalog["rep_id"]),
                    "position": 1,
                    "target_sets": 3,
                    "target_reps": 10,
                },
                {
                    "exercise_id": str(seed_exercise_catalog["dur_id"]),
                    "position": 2,
                    "target_sets": 2,
                    "target_duration_seconds": 30,
                },
            ],
        },
        headers=headers,
    )
    assert res_create.status_code == 201
    routine = res_create.json()
    r_id = routine["id"]
    ex1_id = routine["exercises"][0]["id"]
    assert routine["version"] == 1

    # 2. Stale base_version should return 409 Conflict
    res_stale = await client.patch(
        f"/api/v1/routines/{r_id}",
        json={"base_version": 999, "name": "Conflict Name"},
        headers=headers,
    )
    assert res_stale.status_code == 409
    assert res_stale.json()["error"]["code"] == "conflict"

    # 3. Successful update replacing child collection:
    # Retain ex1 (updated), omit ex2 (soft-deleted), add new child
    patch_payload = {
        "base_version": 1,
        "name": "Versioned Routine v2",
        "exercises": [
            {
                "id": ex1_id,
                "exercise_id": str(seed_exercise_catalog["rep_id"]),
                "position": 1,
                "target_sets": 4,  # updated
                "target_reps": 12,  # updated
            },
            {
                # New child
                "exercise_id": str(seed_exercise_catalog["dur_id"]),
                "position": 2,
                "target_sets": 3,
                "target_duration_seconds": 60,
            },
        ],
    }
    res_patch = await client.patch(
        f"/api/v1/routines/{r_id}", json=patch_payload, headers=headers
    )
    assert res_patch.status_code == 200
    updated = res_patch.json()
    assert updated["name"] == "Versioned Routine v2"
    assert updated["version"] == 2
    assert len(updated["exercises"]) == 2
    assert updated["exercises"][0]["id"] == ex1_id
    assert updated["exercises"][0]["target_sets"] == 4
    # The new child received a new ID
    assert updated["exercises"][1]["id"] != routine["exercises"][1]["id"]


@pytest.mark.asyncio
async def test_delete_routine_soft_deletes_and_is_idempotent(
    api_client: tuple[AsyncClient, rsa.RSAPrivateKey, async_sessionmaker[AsyncSession]],
    seed_exercise_catalog: dict[str, uuid.UUID],
) -> None:
    client, private_key, _ = api_client
    token = mint_token(private_key, sub="clerk_routine_del_user")
    headers = {"Authorization": f"Bearer {token}"}

    # Create routine
    res_create = await client.post(
        "/api/v1/routines",
        json={
            "name": "Routine to Delete",
            "exercises": [
                {
                    "exercise_id": str(seed_exercise_catalog["rep_id"]),
                    "position": 1,
                    "target_sets": 3,
                    "target_reps": 10,
                }
            ],
        },
        headers=headers,
    )
    assert res_create.status_code == 201
    r_id = res_create.json()["id"]

    # DELETE returns 204
    res_del1 = await client.delete(f"/api/v1/routines/{r_id}", headers=headers)
    assert res_del1.status_code == 204

    # Repeated DELETE is idempotent (204)
    res_del2 = await client.delete(f"/api/v1/routines/{r_id}", headers=headers)
    assert res_del2.status_code == 204

    # GET standard returns 404
    res_get = await client.get(f"/api/v1/routines/{r_id}", headers=headers)
    assert res_get.status_code == 404

    # GET with include_deleted=true returns the soft-deleted routine
    res_get_del = await client.get(
        f"/api/v1/routines/{r_id}?include_deleted=true", headers=headers
    )
    assert res_get_del.status_code == 200
    assert res_get_del.json()["deleted_at"] is not None
