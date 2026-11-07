from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import conflict, not_found, unprocessable_entity
from app.core.pagination import decode_cursor, encode_cursor
from app.models.entities import Exercise, RoutineExercise, WorkoutRoutine
from app.schemas.routines import (
    RoutineCreate,
    RoutineExerciseResponse,
    RoutineListResponse,
    RoutineResponse,
    RoutineUpdate,
)


def format_routine_response(
    routine: WorkoutRoutine, *, include_deleted: bool = False
) -> RoutineResponse:
    exercises = routine.exercises or []
    if not include_deleted:
        exercises = [e for e in exercises if e.deleted_at is None]
    exercises = sorted(exercises, key=lambda x: x.position)

    return RoutineResponse(
        id=routine.id,
        name=routine.name,
        description=routine.description,
        category=routine.category,
        created_at=routine.created_at,
        updated_at=routine.updated_at,
        deleted_at=routine.deleted_at,
        version=routine.version,
        server_updated_at=routine.server_updated_at,
        exercises=[
            RoutineExerciseResponse(
                id=e.id,
                exercise_id=e.exercise_id,
                position=e.position,
                target_sets=e.target_sets,
                target_reps=e.target_reps,
                target_duration_seconds=e.target_duration_seconds,
                weight_kg=e.weight_kg,
                rest_seconds=e.rest_seconds,
                deleted_at=e.deleted_at,
                version=e.version,
                server_updated_at=e.server_updated_at,
            )
            for e in exercises
        ],
    )


async def list_routines(
    session: AsyncSession,
    *,
    user_id: UUID,
    include_deleted: bool = False,
    updated_since: datetime | None = None,
    limit: int = 50,
    cursor: str | None = None,
) -> RoutineListResponse:
    limit = max(1, min(limit, 100))
    query = (
        select(WorkoutRoutine)
        .where(WorkoutRoutine.user_id == user_id)
        .options(selectinload(WorkoutRoutine.exercises))
    )

    if not include_deleted:
        query = query.where(WorkoutRoutine.deleted_at.is_(None))

    if updated_since:
        query = query.where(WorkoutRoutine.updated_at > updated_since)

    cursor_data = decode_cursor(cursor)
    if cursor_data:
        c_updated = datetime.fromisoformat(cursor_data["updated_at"])
        c_id = UUID(cursor_data["id"])
        query = query.where(
            or_(
                WorkoutRoutine.updated_at < c_updated,
                (WorkoutRoutine.updated_at == c_updated) & (WorkoutRoutine.id < c_id),
            )
        )

    query = query.order_by(
        WorkoutRoutine.updated_at.desc(), WorkoutRoutine.id.desc()
    ).limit(limit + 1)
    result = await session.scalars(query)
    items = list(result.unique().all())

    next_cursor = None
    if len(items) > limit:
        items = items[:limit]
        last_item = items[-1]
        next_cursor = encode_cursor(
            {
                "updated_at": last_item.updated_at.isoformat(),
                "id": str(last_item.id),
            }
        )

    return RoutineListResponse(
        items=[
            format_routine_response(r, include_deleted=include_deleted) for r in items
        ],
        next_cursor=next_cursor,
    )


async def get_routine(
    session: AsyncSession,
    *,
    user_id: UUID,
    routine_id: UUID,
    include_deleted: bool = False,
) -> RoutineResponse:
    query = (
        select(WorkoutRoutine)
        .where(
            WorkoutRoutine.id == routine_id,
            WorkoutRoutine.user_id == user_id,
        )
        .options(selectinload(WorkoutRoutine.exercises))
    )
    routine = await session.scalar(query)
    if routine is None:
        raise not_found("Routine not found.")
    if routine.deleted_at is not None and not include_deleted:
        raise not_found("Routine not found.")
    return format_routine_response(routine, include_deleted=include_deleted)


async def _validate_exercise_references(
    session: AsyncSession, exercises_input: list
) -> None:
    for ex_item in exercises_input:
        cat_ex = await session.get(Exercise, ex_item.exercise_id)
        if cat_ex is None or not cat_ex.is_active:
            raise not_found(
                f"Referenced exercise {ex_item.exercise_id} not found or inactive."
            )
        if cat_ex.tracking_type == "reps" and ex_item.target_reps is None:
            raise unprocessable_entity(
                f"Exercise '{cat_ex.name}' requires target_reps."
            )
        elif (
            cat_ex.tracking_type == "duration"
            and ex_item.target_duration_seconds is None
        ):
            raise unprocessable_entity(
                f"Exercise '{cat_ex.name}' requires target_duration_seconds."
            )
        elif cat_ex.tracking_type == "weight_reps" and ex_item.target_reps is None:
            raise unprocessable_entity(
                f"Exercise '{cat_ex.name}' requires target_reps."
            )


async def create_routine(
    session: AsyncSession,
    *,
    user_id: UUID,
    data: RoutineCreate,
) -> RoutineResponse:
    if data.id is not None:
        existing = await session.get(WorkoutRoutine, data.id)
        if existing is not None:
            raise conflict("Routine with this ID already exists.")

    await _validate_exercise_references(session, data.exercises)

    routine_id = data.id or uuid4()
    routine = WorkoutRoutine(
        id=routine_id,
        user_id=user_id,
        name=data.name,
        description=data.description,
        category=data.category,
        version=1,
    )
    session.add(routine)

    for ex_item in data.exercises:
        child = RoutineExercise(
            id=ex_item.id or uuid4(),
            routine_id=routine.id,
            exercise_id=ex_item.exercise_id,
            position=ex_item.position,
            target_sets=ex_item.target_sets,
            target_reps=ex_item.target_reps,
            target_duration_seconds=ex_item.target_duration_seconds,
            weight_kg=ex_item.weight_kg,
            rest_seconds=ex_item.rest_seconds,
            version=1,
        )
        session.add(child)

    await session.commit()
    return await get_routine(session, user_id=user_id, routine_id=routine.id)


async def update_routine(
    session: AsyncSession,
    *,
    user_id: UUID,
    routine_id: UUID,
    data: RoutineUpdate,
) -> RoutineResponse:
    query = (
        select(WorkoutRoutine)
        .where(
            WorkoutRoutine.id == routine_id,
            WorkoutRoutine.user_id == user_id,
            WorkoutRoutine.deleted_at.is_(None),
        )
        .options(selectinload(WorkoutRoutine.exercises))
    )
    routine = await session.scalar(query)
    if routine is None:
        raise not_found("Routine not found.")

    if routine.version != data.base_version:
        current_data = format_routine_response(routine)
        raise conflict(
            "Routine version conflict. The routine has been modified.",
            details={"current": current_data.model_dump(mode="json")},
        )

    if data.name is not None:
        routine.name = data.name
    if data.description is not None:
        routine.description = data.description
    if data.category is not None:
        routine.category = data.category

    if data.exercises is not None:
        await _validate_exercise_references(session, data.exercises)
        existing_map = {e.id: e for e in routine.exercises if e.deleted_at is None}
        incoming_ids = {e.id for e in data.exercises if e.id is not None}

        # Tombstone omitted children and move them out of position range
        tombstone_pos = 100000
        for cid, child in existing_map.items():
            if cid not in incoming_ids:
                child.deleted_at = func.now()
                child.version += 1
                child.server_updated_at = func.now()
                child.position = tombstone_pos
                tombstone_pos += 1
        await session.flush()

        # Update existing positions to temporary non-conflicting positions
        temp_pos = 200000
        for ex_item in data.exercises:
            if ex_item.id and ex_item.id in existing_map:
                existing_map[ex_item.id].position = temp_pos
                temp_pos += 1
        await session.flush()

        # Update or insert final positions
        for ex_item in data.exercises:
            if ex_item.id and ex_item.id in existing_map:
                c = existing_map[ex_item.id]
                c.exercise_id = ex_item.exercise_id
                c.position = ex_item.position
                c.target_sets = ex_item.target_sets
                c.target_reps = ex_item.target_reps
                c.target_duration_seconds = ex_item.target_duration_seconds
                c.weight_kg = ex_item.weight_kg
                c.rest_seconds = ex_item.rest_seconds
                c.version += 1
                c.server_updated_at = func.now()
            else:
                new_child = RoutineExercise(
                    id=ex_item.id or uuid4(),
                    routine_id=routine.id,
                    exercise_id=ex_item.exercise_id,
                    position=ex_item.position,
                    target_sets=ex_item.target_sets,
                    target_reps=ex_item.target_reps,
                    target_duration_seconds=ex_item.target_duration_seconds,
                    weight_kg=ex_item.weight_kg,
                    rest_seconds=ex_item.rest_seconds,
                    version=1,
                    server_updated_at=func.now(),
                )
                session.add(new_child)
                routine.exercises.append(new_child)

    routine.version += 1
    routine.updated_at = func.now()
    routine.server_updated_at = func.now()
    await session.commit()
    session.expire(routine, ["exercises"])
    return await get_routine(session, user_id=user_id, routine_id=routine_id)


async def delete_routine(
    session: AsyncSession,
    *,
    user_id: UUID,
    routine_id: UUID,
) -> None:
    query = (
        select(WorkoutRoutine)
        .where(
            WorkoutRoutine.id == routine_id,
            WorkoutRoutine.user_id == user_id,
        )
        .options(selectinload(WorkoutRoutine.exercises))
    )
    routine = await session.scalar(query)
    if routine is None:
        raise not_found("Routine not found.")

    if routine.deleted_at is not None:
        # Idempotent deletion
        return

    routine.deleted_at = func.now()
    routine.version += 1
    routine.server_updated_at = func.now()

    for child in routine.exercises:
        if child.deleted_at is None:
            child.deleted_at = func.now()
            child.version += 1
            child.server_updated_at = func.now()

    await session.commit()
