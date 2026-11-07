from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.entities import Exercise


class EquipmentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class MuscleGroupItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    is_primary: bool


class ExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    instructions: list[str] | None = None
    tips: list[str] | None = None
    difficulty: str
    tracking_type: str
    equipment: list[EquipmentItem] = Field(default_factory=list)
    muscle_groups: list[MuscleGroupItem] = Field(default_factory=list)
    default_sets: int | None = None
    default_reps: int | None = None
    default_rest_seconds: int | None = None
    accent_color: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm_exercise(cls, ex: Exercise) -> ExerciseResponse:
        equip = [
            EquipmentItem(id=ee.equipment.id, name=ee.equipment.name)
            for ee in (ex.exercise_equipments or [])
            if ee.equipment is not None
        ]
        muscles = [
            MuscleGroupItem(
                id=emg.muscle_group.id,
                name=emg.muscle_group.name,
                is_primary=emg.is_primary,
            )
            for emg in (ex.exercise_muscle_groups or [])
            if emg.muscle_group is not None
        ]
        return cls(
            id=ex.id,
            name=ex.name,
            description=ex.description,
            instructions=ex.instructions,
            tips=ex.tips,
            difficulty=ex.difficulty,
            tracking_type=ex.tracking_type,
            equipment=equip,
            muscle_groups=muscles,
            default_sets=ex.default_sets,
            default_reps=ex.default_reps,
            default_rest_seconds=ex.default_rest_seconds,
            accent_color=ex.accent_color,
            is_active=ex.is_active,
            created_at=ex.created_at,
            updated_at=ex.updated_at,
        )


class ExerciseListResponse(BaseModel):
    items: list[ExerciseResponse]
    next_cursor: str | None = None
