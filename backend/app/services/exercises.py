from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import String, cast, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import not_found
from app.core.pagination import decode_cursor, encode_cursor
from app.models.entities import (
    Equipment,
    Exercise,
    ExerciseEquipment,
    ExerciseMuscleGroup,
    MuscleGroup,
)
from app.schemas.exercises import ExerciseListResponse, ExerciseResponse


async def list_exercises(
    session: AsyncSession,
    *,
    q: str | None = None,
    difficulty: str | None = None,
    equipment: str | None = None,
    muscle_group: str | None = None,
    updated_since: datetime | None = None,
    limit: int = 50,
    cursor: str | None = None,
) -> ExerciseListResponse:
    limit = max(1, min(limit, 100))
    query = (
        select(Exercise)
        .where(Exercise.is_active.is_(True))
        .options(
            selectinload(Exercise.exercise_equipments).selectinload(
                ExerciseEquipment.equipment
            ),
            selectinload(Exercise.exercise_muscle_groups).selectinload(
                ExerciseMuscleGroup.muscle_group
            ),
        )
    )

    if q:
        search = f"%{q.strip()}%"
        query = query.where(
            or_(
                Exercise.name.ilike(search),
                Exercise.description.ilike(search),
            )
        )

    if difficulty:
        query = query.where(Exercise.difficulty == difficulty.strip().lower())

    if updated_since:
        query = query.where(Exercise.updated_at > updated_since)

    if equipment:
        eq_filter = equipment.strip()
        query = (
            query.join(Exercise.exercise_equipments)
            .join(ExerciseEquipment.equipment)
            .where(
                or_(
                    Equipment.name.ilike(eq_filter),
                    cast(Equipment.id, String) == eq_filter,
                )
            )
        )

    if muscle_group:
        mg_filter = muscle_group.strip()
        query = (
            query.join(Exercise.exercise_muscle_groups)
            .join(ExerciseMuscleGroup.muscle_group)
            .where(
                or_(
                    MuscleGroup.name.ilike(mg_filter),
                    cast(MuscleGroup.id, String) == mg_filter,
                )
            )
        )

    cursor_data = decode_cursor(cursor)
    if cursor_data:
        c_name = cursor_data.get("name")
        c_id = UUID(cursor_data["id"])
        query = query.where(
            or_(
                Exercise.name > c_name,
                (Exercise.name == c_name) & (Exercise.id > c_id),
            )
        )

    query = query.order_by(Exercise.name.asc(), Exercise.id.asc()).limit(limit + 1)
    result = await session.scalars(query)
    items = list(result.unique().all())

    next_cursor = None
    if len(items) > limit:
        items = items[:limit]
        last_item = items[-1]
        next_cursor = encode_cursor({"name": last_item.name, "id": str(last_item.id)})

    return ExerciseListResponse(
        items=[ExerciseResponse.from_orm_exercise(ex) for ex in items],
        next_cursor=next_cursor,
    )


async def get_exercise(session: AsyncSession, *, exercise_id: UUID) -> ExerciseResponse:
    query = (
        select(Exercise)
        .where(Exercise.id == exercise_id, Exercise.is_active.is_(True))
        .options(
            selectinload(Exercise.exercise_equipments).selectinload(
                ExerciseEquipment.equipment
            ),
            selectinload(Exercise.exercise_muscle_groups).selectinload(
                ExerciseMuscleGroup.muscle_group
            ),
        )
    )
    result = await session.scalars(query)
    exercise = result.unique().first()
    if exercise is None:
        raise not_found("Exercise not found.")
    return ExerciseResponse.from_orm_exercise(exercise)
