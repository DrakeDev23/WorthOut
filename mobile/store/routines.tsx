import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { ROUTINES } from '@/data';
import { getExerciseById } from '@/data';
import type { MuscleGroup, Routine, RoutineCategory, RoutineExercise } from '@/types/models';

let entrySeq = 0;
function nextEntryId(): string {
  entrySeq += 1;
  return `entry-${Date.now()}-${entrySeq}`;
}

let routineSeq = 0;
function nextRoutineId(): string {
  routineSeq += 1;
  return `routine-${Date.now()}-${routineSeq}`;
}

export function estimateMinutes(exercises: RoutineExercise[]): number {
  if (exercises.length === 0) return 0;
  const seconds = exercises.reduce((total, item) => {
    const workSeconds = (item.durationSeconds ?? 40) * item.sets;
    const restSeconds = item.restSeconds * item.sets;
    return total + workSeconds + restSeconds;
  }, 0);
  return Math.max(5, Math.round(seconds / 60));
}

/**
 * Derive the dominant muscle group for a routine from its exercises so the
 * `focus` field stays accurate as exercises are added, removed or reordered.
 */
function deriveFocus(exercises: RoutineExercise[], fallback: MuscleGroup = 'Full Body'): MuscleGroup {
  const counts = new Map<MuscleGroup, number>();
  for (const item of exercises) {
    const exercise = getExerciseById(item.exerciseId);
    if (!exercise) continue;
    counts.set(exercise.muscleGroup, (counts.get(exercise.muscleGroup) ?? 0) + 1);
  }
  if (counts.size === 0) return fallback;
  let best: MuscleGroup = fallback;
  let bestCount = -1;
  for (const [group, count] of counts) {
    if (count > bestCount) {
      best = group;
      bestCount = count;
    }
  }
  return best;
}

/** Ordered, de-duplicated list of muscle groups a routine targets. */
export function routineMuscleGroups(routine: Routine): MuscleGroup[] {
  const seen = new Set<MuscleGroup>();
  const groups: MuscleGroup[] = [];
  for (const item of routine.exercises) {
    const exercise = getExerciseById(item.exerciseId);
    if (!exercise || seen.has(exercise.muscleGroup)) continue;
    seen.add(exercise.muscleGroup);
    groups.push(exercise.muscleGroup);
  }
  return groups;
}

function makeEntry(exerciseId: string): RoutineExercise | null {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return null;
  return {
    entryId: nextEntryId(),
    exerciseId,
    sets: exercise.defaultSets,
    reps: exercise.defaultReps,
    durationSeconds: exercise.defaultReps <= 1 ? 45 : undefined,
    restSeconds: exercise.defaultRestSeconds,
  };
}

/** Recompute derived fields (duration, focus, updatedAt) after any mutation. */
function withDerived(routine: Routine, exercises: RoutineExercise[]): Routine {
  return {
    ...routine,
    exercises,
    estimatedMinutes: estimateMinutes(exercises),
    focus: deriveFocus(exercises, routine.focus),
    updatedAt: new Date().toISOString(),
  };
}

export interface CreateRoutineInput {
  name: string;
  description?: string;
  category?: RoutineCategory;
}

export interface UpdateRoutineInput {
  name?: string;
  description?: string;
  category?: RoutineCategory;
}

export type RoutineExercisePatch = Partial<
  Pick<RoutineExercise, 'sets' | 'reps' | 'durationSeconds' | 'weightKg' | 'restSeconds'>
>;

interface RoutinesContextValue {
  routines: Routine[];
  getRoutine: (routineId: string) => Routine | undefined;
  // Stage 3 compatibility
  addExerciseToRoutine: (routineId: string, exerciseId: string) => boolean;
  createRoutineWithExercise: (name: string, exerciseId: string) => string | null;
  // Stage 4 routine CRUD
  createRoutine: (input: CreateRoutineInput) => string;
  updateRoutine: (routineId: string, input: UpdateRoutineInput) => void;
  deleteRoutine: (routineId: string) => void;
  // Stage 4 exercise management
  removeExerciseFromRoutine: (routineId: string, entryId: string) => void;
  updateRoutineExercise: (routineId: string, entryId: string, patch: RoutineExercisePatch) => void;
  moveExercise: (routineId: string, entryId: string, direction: 'up' | 'down') => void;
  routineHasExercise: (routineId: string, exerciseId: string) => boolean;
}

const RoutinesContext = createContext<RoutinesContextValue | null>(null);

export function RoutinesProvider({ children }: { children: React.ReactNode }) {
  const [routines, setRoutines] = useState<Routine[]>(ROUTINES);

  const getRoutine = useCallback(
    (routineId: string) => routines.find((routine) => routine.id === routineId),
    [routines]
  );

  const routineHasExercise = useCallback(
    (routineId: string, exerciseId: string) => {
      const routine = routines.find((item) => item.id === routineId);
      if (!routine) return false;
      return routine.exercises.some((entry) => entry.exerciseId === exerciseId);
    },
    [routines]
  );

  const addExerciseToRoutine = useCallback((routineId: string, exerciseId: string) => {
    const entry = makeEntry(exerciseId);
    if (!entry) return false;
    let added = false;
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine;
        // Avoid duplicate exercises within the same routine.
        if (routine.exercises.some((item) => item.exerciseId === exerciseId)) {
          return routine;
        }
        added = true;
        return withDerived(routine, [...routine.exercises, entry]);
      })
    );
    return added;
  }, []);

  const createRoutineWithExercise = useCallback((name: string, exerciseId: string) => {
    const entry = makeEntry(exerciseId);
    if (!entry) return null;
    const id = nextRoutineId();
    const exercises = [entry];
    const routine: Routine = {
      id,
      name: name.trim() || 'New Routine',
      exercises,
      estimatedMinutes: estimateMinutes(exercises),
      focus: deriveFocus(exercises),
      updatedAt: new Date().toISOString(),
    };
    setRoutines((prev) => [routine, ...prev]);
    return id;
  }, []);

  const createRoutine = useCallback((input: CreateRoutineInput) => {
    const id = nextRoutineId();
    const routine: Routine = {
      id,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      category: input.category,
      exercises: [],
      estimatedMinutes: 0,
      focus: 'Full Body',
      updatedAt: new Date().toISOString(),
    };
    setRoutines((prev) => [routine, ...prev]);
    return id;
  }, []);

  const updateRoutine = useCallback((routineId: string, input: UpdateRoutineInput) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine;
        return {
          ...routine,
          name: input.name !== undefined ? input.name.trim() || routine.name : routine.name,
          description:
            input.description !== undefined
              ? input.description.trim() || undefined
              : routine.description,
          category: input.category !== undefined ? input.category : routine.category,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const deleteRoutine = useCallback((routineId: string) => {
    setRoutines((prev) => prev.filter((routine) => routine.id !== routineId));
  }, []);

  const removeExerciseFromRoutine = useCallback((routineId: string, entryId: string) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine;
        const exercises = routine.exercises.filter((entry) => entry.entryId !== entryId);
        return withDerived(routine, exercises);
      })
    );
  }, []);

  const updateRoutineExercise = useCallback(
    (routineId: string, entryId: string, patch: RoutineExercisePatch) => {
      setRoutines((prev) =>
        prev.map((routine) => {
          if (routine.id !== routineId) return routine;
          const exercises = routine.exercises.map((entry) =>
            entry.entryId === entryId ? { ...entry, ...patch } : entry
          );
          return withDerived(routine, exercises);
        })
      );
    },
    []
  );

  const moveExercise = useCallback(
    (routineId: string, entryId: string, direction: 'up' | 'down') => {
      setRoutines((prev) =>
        prev.map((routine) => {
          if (routine.id !== routineId) return routine;
          const index = routine.exercises.findIndex((entry) => entry.entryId === entryId);
          if (index === -1) return routine;
          const target = direction === 'up' ? index - 1 : index + 1;
          if (target < 0 || target >= routine.exercises.length) return routine;
          const exercises = [...routine.exercises];
          [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
          return withDerived(routine, exercises);
        })
      );
    },
    []
  );

  const value = useMemo<RoutinesContextValue>(
    () => ({
      routines,
      getRoutine,
      addExerciseToRoutine,
      createRoutineWithExercise,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      removeExerciseFromRoutine,
      updateRoutineExercise,
      moveExercise,
      routineHasExercise,
    }),
    [
      routines,
      getRoutine,
      addExerciseToRoutine,
      createRoutineWithExercise,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      removeExerciseFromRoutine,
      updateRoutineExercise,
      moveExercise,
      routineHasExercise,
    ]
  );

  return <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>;
}

export function useRoutines(): RoutinesContextValue {
  const context = useContext(RoutinesContext);
  if (!context) {
    throw new Error('useRoutines must be used within a RoutinesProvider.');
  }
  return context;
}
