import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getExerciseById } from '@/data';
import { uuidV4 } from '@/database/ids';
import { deriveFocus, estimateMinutes, routineMuscleGroups } from '@/features/routine-derive';
import { routineRepository } from '@/repositories/routine.repository';
import type { MuscleGroup, Routine, RoutineCategory, RoutineExercise } from '@/types/models';

export { estimateMinutes, routineMuscleGroups };
export type { MuscleGroup };

function nextEntryId(): string {
  return uuidV4();
}

function nextRoutineId(): string {
  return uuidV4();
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
  isLoading: boolean;
  getRoutine: (routineId: string) => Routine | undefined;

  addExerciseToRoutine: (routineId: string, exerciseId: string) => boolean;
  createRoutineWithExercise: (name: string, exerciseId: string) => string | null;

  createRoutine: (input: CreateRoutineInput) => string;
  updateRoutine: (routineId: string, input: UpdateRoutineInput) => void;
  deleteRoutine: (routineId: string) => void;

  removeExerciseFromRoutine: (routineId: string, entryId: string) => void;
  updateRoutineExercise: (routineId: string, entryId: string, patch: RoutineExercisePatch) => void;
  moveExercise: (routineId: string, entryId: string, direction: 'up' | 'down') => void;
  routineHasExercise: (routineId: string, exerciseId: string) => boolean;
}

const RoutinesContext = createContext<RoutinesContextValue | null>(null);

export function RoutinesProvider({ children }: { children: React.ReactNode }) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback((operation: Promise<unknown>) => {
    operation.catch((error) => {
      console.error('[routines] persistence error:', error);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    routineRepository
      .getAll()
      .then((loaded) => {
        if (!cancelled) {
          setRoutines(loaded);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('[routines] failed to load routines:', error);
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const mutateExercises = useCallback(
    (routineId: string, transform: (exercises: RoutineExercise[]) => RoutineExercise[] | null) => {
      setRoutines((prev) =>
        prev.map((routine) => {
          if (routine.id !== routineId) return routine;
          const nextExercises = transform(routine.exercises);
          if (nextExercises === null) return routine;
          const updated = withDerived(routine, nextExercises);
          persist(routineRepository.setExercises(routineId, updated.exercises, updated.updatedAt));
          return updated;
        })
      );
    },
    [persist]
  );

  const addExerciseToRoutine = useCallback(
    (routineId: string, exerciseId: string) => {
      const entry = makeEntry(exerciseId);
      if (!entry) return false;
      let added = false;
      setRoutines((prev) =>
        prev.map((routine) => {
          if (routine.id !== routineId) return routine;
          if (routine.exercises.some((item) => item.exerciseId === exerciseId)) {
            return routine;
          }
          added = true;
          const updated = withDerived(routine, [...routine.exercises, entry]);
          persist(routineRepository.setExercises(routineId, updated.exercises, updated.updatedAt));
          return updated;
        })
      );
      return added;
    },
    [persist]
  );

  const createRoutineWithExercise = useCallback(
    (name: string, exerciseId: string) => {
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
      persist(routineRepository.create(routine));
      return id;
    },
    [persist]
  );

  const createRoutine = useCallback(
    (input: CreateRoutineInput) => {
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
      persist(routineRepository.create(routine));
      return id;
    },
    [persist]
  );

  const updateRoutine = useCallback(
    (routineId: string, input: UpdateRoutineInput) => {
      setRoutines((prev) =>
        prev.map((routine) => {
          if (routine.id !== routineId) return routine;
          const updated: Routine = {
            ...routine,
            name: input.name !== undefined ? input.name.trim() || routine.name : routine.name,
            description:
              input.description !== undefined
                ? input.description.trim() || undefined
                : routine.description,
            category: input.category !== undefined ? input.category : routine.category,
            updatedAt: new Date().toISOString(),
          };
          persist(
            routineRepository.update(routineId, {
              name: updated.name,
              description: updated.description,
              category: updated.category,
              updatedAt: updated.updatedAt,
            })
          );
          return updated;
        })
      );
    },
    [persist]
  );

  const deleteRoutine = useCallback(
    (routineId: string) => {
      setRoutines((prev) => prev.filter((routine) => routine.id !== routineId));
      persist(routineRepository.delete(routineId));
    },
    [persist]
  );

  const removeExerciseFromRoutine = useCallback(
    (routineId: string, entryId: string) => {
      mutateExercises(routineId, (exercises) =>
        exercises.filter((entry) => entry.entryId !== entryId)
      );
    },
    [mutateExercises]
  );

  const updateRoutineExercise = useCallback(
    (routineId: string, entryId: string, patch: RoutineExercisePatch) => {
      mutateExercises(routineId, (exercises) =>
        exercises.map((entry) => (entry.entryId === entryId ? { ...entry, ...patch } : entry))
      );
    },
    [mutateExercises]
  );

  const moveExercise = useCallback(
    (routineId: string, entryId: string, direction: 'up' | 'down') => {
      mutateExercises(routineId, (exercises) => {
        const index = exercises.findIndex((entry) => entry.entryId === entryId);
        if (index === -1) return null;
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= exercises.length) return null;
        const next = [...exercises];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
    },
    [mutateExercises]
  );

  const value = useMemo<RoutinesContextValue>(
    () => ({
      routines,
      isLoading,
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
      isLoading,
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
