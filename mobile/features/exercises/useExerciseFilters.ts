import { useMemo, useState } from 'react';

import { EXERCISES } from '@/data';
import type { Difficulty, Equipment, Exercise, MuscleGroup } from '@/types/models';

export interface ExerciseFilterState {
  query: string;
  muscleGroup: MuscleGroup | null;
  equipment: Equipment | null;
  difficulty: Difficulty | null;
}

const INITIAL_STATE: ExerciseFilterState = {
  query: '',
  muscleGroup: null,
  equipment: null,
  difficulty: null,
};

function matches(exercise: Exercise, state: ExerciseFilterState): boolean {
  const query = state.query.trim().toLowerCase();
  if (query) {
    const haystack = `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (state.muscleGroup && exercise.muscleGroup !== state.muscleGroup) return false;
  if (state.equipment && exercise.equipment !== state.equipment) return false;
  if (state.difficulty && exercise.difficulty !== state.difficulty) return false;
  return true;
}

export function useExerciseFilters() {
  const [state, setState] = useState<ExerciseFilterState>(INITIAL_STATE);

  const results = useMemo(() => EXERCISES.filter((exercise) => matches(exercise, state)), [state]);

  const activeFilterCount =
    (state.muscleGroup ? 1 : 0) + (state.equipment ? 1 : 0) + (state.difficulty ? 1 : 0);

  const setQuery = (query: string) => setState((prev) => ({ ...prev, query }));
  const setMuscleGroup = (muscleGroup: MuscleGroup | null) =>
    setState((prev) => ({ ...prev, muscleGroup }));
  const setEquipment = (equipment: Equipment | null) =>
    setState((prev) => ({ ...prev, equipment }));
  const setDifficulty = (difficulty: Difficulty | null) =>
    setState((prev) => ({ ...prev, difficulty }));
  const reset = () => setState(INITIAL_STATE);

  return {
    state,
    results,
    activeFilterCount,
    setQuery,
    setMuscleGroup,
    setEquipment,
    setDifficulty,
    reset,
  };
}
