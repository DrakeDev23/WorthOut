from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RoutineExerciseCreate(BaseModel):
    id: UUID | None = None
    exercise_id: UUID
    position: int = Field(ge=1)
    target_sets: int = Field(ge=1)
    target_reps: int | None = Field(default=None, ge=0)
    target_duration_seconds: int | None = Field(default=None, ge=0)
    weight_kg: Decimal | float | None = Field(default=None, ge=0)
    rest_seconds: int = Field(default=60, ge=0)

    @field_validator("weight_kg")
    @classmethod
    def validate_weight_scale(cls, v: Decimal | float | None) -> Decimal | float | None:
        if v is not None:
            dec = Decimal(str(v))
            if dec.as_tuple().exponent < -2:
                raise ValueError("weight_kg cannot have more than 2 decimal places")
        return v


class RoutineExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    exercise_id: UUID
    position: int
    target_sets: int
    target_reps: int | None = None
    target_duration_seconds: int | None = None
    weight_kg: Decimal | float | None = None
    rest_seconds: int
    deleted_at: datetime | None = None
    version: int
    server_updated_at: datetime


class RoutineCreate(BaseModel):
    id: UUID | None = None
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10000)
    category: str | None = Field(default=None, max_length=50)
    exercises: list[RoutineExerciseCreate] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Routine name cannot be empty or whitespace only.")
        return trimmed

    @field_validator("exercises")
    @classmethod
    def validate_positions(
        cls, exercises: list[RoutineExerciseCreate]
    ) -> list[RoutineExerciseCreate]:
        if exercises:
            positions = [e.position for e in exercises]
            if sorted(positions) != list(range(1, len(exercises) + 1)):
                raise ValueError(
                    "Exercise positions must be positive, contiguous, unique 1-based integers."
                )
        return exercises


class RoutineUpdate(BaseModel):
    base_version: int = Field(ge=1)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10000)
    category: str | None = Field(default=None, max_length=50)
    exercises: list[RoutineExerciseCreate] | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Routine name cannot be empty or whitespace only.")
            return trimmed
        return v

    @field_validator("exercises")
    @classmethod
    def validate_positions(
        cls, exercises: list[RoutineExerciseCreate] | None
    ) -> list[RoutineExerciseCreate] | None:
        if exercises is not None and exercises:
            positions = [e.position for e in exercises]
            if sorted(positions) != list(range(1, len(exercises) + 1)):
                raise ValueError(
                    "Exercise positions must be positive, contiguous, unique 1-based integers."
                )
        return exercises


class RoutineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    category: str | None = None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    version: int
    server_updated_at: datetime
    exercises: list[RoutineExerciseResponse] = Field(default_factory=list)


class RoutineListResponse(BaseModel):
    items: list[RoutineResponse]
    next_cursor: str | None = None
