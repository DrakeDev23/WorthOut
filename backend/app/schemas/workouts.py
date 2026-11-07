from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExerciseSetCreate(BaseModel):
    id: UUID | None = None
    set_number: int = Field(ge=1)
    repetitions: int | None = Field(default=None, ge=0)
    weight_kg: Decimal | float | None = Field(default=None, ge=0)
    duration_seconds: int | None = Field(default=None, ge=0)
    is_completed: bool = True

    @field_validator("weight_kg")
    @classmethod
    def validate_weight_scale(cls, v: Decimal | float | None) -> Decimal | float | None:
        if v is not None:
            dec = Decimal(str(v))
            if dec.as_tuple().exponent < -2:
                raise ValueError("weight_kg cannot have more than 2 decimal places")
        return v


class ExerciseSetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    set_number: int
    repetitions: int | None = None
    weight_kg: Decimal | float | None = None
    duration_seconds: int | None = None
    is_completed: bool


class WorkoutExerciseCreate(BaseModel):
    id: UUID | None = None
    exercise_id: UUID
    exercise_name_snapshot: str | None = None
    position: int = Field(ge=1)
    notes: str | None = None
    sets: list[ExerciseSetCreate] = Field(default_factory=list)

    @field_validator("sets")
    @classmethod
    def validate_sets(cls, sets: list[ExerciseSetCreate]) -> list[ExerciseSetCreate]:
        if sets:
            numbers = [s.set_number for s in sets]
            if sorted(numbers) != list(range(1, len(sets) + 1)):
                raise ValueError(
                    "Set numbers must be positive, contiguous, unique 1-based integers."
                )
        return sets


class WorkoutExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    exercise_id: UUID
    exercise_name_snapshot: str
    position: int
    notes: str | None = None
    sets: list[ExerciseSetResponse] = Field(default_factory=list)


class WorkoutCreate(BaseModel):
    id: UUID | None = None
    routine_id: UUID | None = None
    name: str = Field(min_length=1, max_length=255)
    routine_name_snapshot: str | None = None
    started_at: datetime
    completed_at: datetime | None = None
    duration_seconds: int | None = Field(default=None, ge=0)
    status: Literal["completed"] = "completed"
    notes: str | None = None
    exercises: list[WorkoutExerciseCreate] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Workout name cannot be empty or whitespace only.")
        return trimmed

    @field_validator("exercises")
    @classmethod
    def validate_exercises(
        cls, exercises: list[WorkoutExerciseCreate]
    ) -> list[WorkoutExerciseCreate]:
        if exercises:
            positions = [e.position for e in exercises]
            if sorted(positions) != list(range(1, len(exercises) + 1)):
                raise ValueError(
                    "Workout exercise positions must be positive, contiguous, unique 1-based integers."
                )
        return exercises


class WorkoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    routine_id: UUID | None = None
    name: str
    routine_name_snapshot: str
    started_at: datetime
    completed_at: datetime | None = None
    duration_seconds: int | None = None
    status: str
    notes: str | None = None
    exercises: list[WorkoutExerciseResponse] = Field(default_factory=list)
    version: int
    server_updated_at: datetime


class WorkoutListResponse(BaseModel):
    items: list[WorkoutResponse]
    next_cursor: str | None = None
