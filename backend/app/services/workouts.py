from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import conflict, not_found
from app.core.pagination import decode_cursor, encode_cursor
from app.models.entities import (
    Exercise,
    ExerciseSet,
    WorkoutExercise,
    WorkoutRoutine,
    WorkoutSession,
)
from app.schemas.workouts import (
    ExerciseSetResponse,
    WorkoutCreate,
    WorkoutExerciseResponse,
    WorkoutListResponse,
    WorkoutResponse,
)


def format_workout_response(session: WorkoutSession) -> WorkoutResponse:
    exercises = session.exercises or []
    exercises = [e for e in exercises if e.deleted_at is None]
    exercises = sorted(exercises, key=lambda x: x.position)

    exercises_resp: list[WorkoutExerciseResponse] = []
    for we in exercises:
        sets = we.sets or []
        sets = [s for s in sets if s.deleted_at is None]
        sets = sorted(sets, key=lambda x: x.set_number)

        sets_resp = [
            ExerciseSetResponse(
                id=s.id,
                set_number=s.set_number,
                repetitions=s.repetitions,
                weight_kg=s.weight_kg,
                duration_seconds=s.duration_seconds,
                is_completed=s.is_completed,
            )
            for s in sets
        ]

        ex_name = we.exercise.name if we.exercise else ""
        exercises_resp.append(
            WorkoutExerciseResponse(
                id=we.id,
                exercise_id=we.exercise_id,
                exercise_name_snapshot=ex_name,
                position=we.position,
                notes=we.notes,
                sets=sets_resp,
            )
        )

    return WorkoutResponse(
        id=session.id,
        routine_id=session.routine_id,
        name=session.name,
        routine_name_snapshot=session.name,
        started_at=session.started_at,
        completed_at=session.completed_at,
        duration_seconds=session.duration_seconds,
        status=session.status,
        notes=session.notes,
        exercises=exercises_resp,
        version=session.version,
        server_updated_at=session.server_updated_at,
    )


async def list_workouts(
    session: AsyncSession,
    *,
    user_id: UUID,
    from_time: datetime | None = None,
    to_time: datetime | None = None,
    limit: int = 50,
    cursor: str | None = None,
) -> WorkoutListResponse:
    limit = max(1, min(limit, 100))
    query = (
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == "completed",
            WorkoutSession.deleted_at.is_(None),
        )
        .options(
            selectinload(WorkoutSession.exercises).selectinload(WorkoutExercise.sets),
            selectinload(WorkoutSession.exercises).selectinload(
                WorkoutExercise.exercise
            ),
        )
    )

    if from_time:
        query = query.where(WorkoutSession.started_at >= from_time)
    if to_time:
        query = query.where(WorkoutSession.started_at <= to_time)

    cursor_data = decode_cursor(cursor)
    if cursor_data:
        c_started = datetime.fromisoformat(cursor_data["started_at"])
        c_id = UUID(cursor_data["id"])
        query = query.where(
            or_(
                WorkoutSession.started_at < c_started,
                (WorkoutSession.started_at == c_started) & (WorkoutSession.id < c_id),
            )
        )

    query = query.order_by(
        WorkoutSession.started_at.desc(), WorkoutSession.id.desc()
    ).limit(limit + 1)
    result = await session.scalars(query)
    items = list(result.unique().all())

    next_cursor = None
    if len(items) > limit:
        items = items[:limit]
        last_item = items[-1]
        next_cursor = encode_cursor(
            {
                "started_at": last_item.started_at.isoformat(),
                "id": str(last_item.id),
            }
        )

    return WorkoutListResponse(
        items=[format_workout_response(w) for w in items],
        next_cursor=next_cursor,
    )


async def get_workout(
    session: AsyncSession,
    *,
    user_id: UUID,
    workout_id: UUID,
) -> WorkoutResponse:
    query = (
        select(WorkoutSession)
        .where(
            WorkoutSession.id == workout_id,
            WorkoutSession.user_id == user_id,
            WorkoutSession.deleted_at.is_(None),
        )
        .options(
            selectinload(WorkoutSession.exercises).selectinload(WorkoutExercise.sets),
            selectinload(WorkoutSession.exercises).selectinload(
                WorkoutExercise.exercise
            ),
        )
    )
    result = await session.scalars(query)
    workout = result.unique().first()
    if workout is None:
        raise not_found("Workout not found.")
    return format_workout_response(workout)


async def create_workout(
    session: AsyncSession,
    *,
    user_id: UUID,
    data: WorkoutCreate,
) -> WorkoutResponse:
    if data.id is not None:
        existing = await session.scalar(
            select(WorkoutSession)
            .where(WorkoutSession.id == data.id)
            .options(
                selectinload(WorkoutSession.exercises).selectinload(
                    WorkoutExercise.sets
                ),
                selectinload(WorkoutSession.exercises).selectinload(
                    WorkoutExercise.exercise
                ),
            )
        )
        if existing is not None:
            if existing.user_id != user_id:
                raise conflict("A workout with this ID already exists.")
            # Check content equivalence for idempotency
            if (
                existing.routine_id == data.routine_id
                and existing.name == data.name
                and len(existing.exercises) == len(data.exercises)
            ):
                return format_workout_response(existing)
            else:
                raise conflict(
                    "Workout with this ID already exists with different content."
                )

    if data.routine_id is not None:
        routine = await session.get(WorkoutRoutine, data.routine_id)
        if routine is None or routine.user_id != user_id:
            raise not_found("Referenced routine not found.")

    for we_item in data.exercises:
        cat_ex = await session.get(Exercise, we_item.exercise_id)
        if cat_ex is None:
            raise not_found(f"Referenced exercise {we_item.exercise_id} not found.")

    workout_id = data.id or uuid4()
    workout_name = data.routine_name_snapshot or data.name
    session_obj = WorkoutSession(
        id=workout_id,
        user_id=user_id,
        routine_id=data.routine_id,
        name=workout_name,
        started_at=data.started_at,
        completed_at=data.completed_at,
        duration_seconds=data.duration_seconds,
        status="completed",
        notes=data.notes,
        version=1,
    )
    session.add(session_obj)

    for we_item in data.exercises:
        we_id = we_item.id or uuid4()
        we_obj = WorkoutExercise(
            id=we_id,
            session_id=workout_id,
            exercise_id=we_item.exercise_id,
            position=we_item.position,
            notes=we_item.notes,
            version=1,
        )
        session.add(we_obj)

        for set_item in we_item.sets:
            set_id = set_item.id or uuid4()
            set_obj = ExerciseSet(
                id=set_id,
                workout_exercise_id=we_id,
                set_number=set_item.set_number,
                repetitions=set_item.repetitions,
                weight_kg=set_item.weight_kg,
                duration_seconds=set_item.duration_seconds,
                is_completed=set_item.is_completed,
                version=1,
            )
            session.add(set_obj)

    await session.commit()
    return await get_workout(session, user_id=user_id, workout_id=workout_id)
