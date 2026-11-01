import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { ROUTINES } from '@/data';
import { getExerciseById } from '@/data';
import type { Routine, RoutineExercise } from '@/types/models';

let entrySeq = 0;
function nextEntryId(): string {
  entrySeq += 1;
  return `entry-${Date.now()}-${entrySeq}`;
}

function estimateMinutes(exercises: RoutineExercise[]): number {
  const seconds = exercises.reduce((total, item) => {
    const workSeconds = (item.durationSeconds ?? 40) * item.sets;
    const restSeconds = item.restSeconds * item.sets;
    return total + workSeconds + restSeconds;
  }, 0);
  return Math.max(10, Math.round(seconds / 60));
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

interface RoutinesContextValue {
  routines: Routine[];
  addExerciseToRoutine: (routineId: string, exerciseId: string) => boolean;
  createRoutineWithExercise: (name: string, exerciseId: string) => string | null;
}

const RoutinesContext = createContext<RoutinesContextValue | null>(null);

export function RoutinesProvider({ children }: { children: React.ReactNode }) {
  const [routines, setRoutines] = useState<Routine[]>(ROUTINES);

  const addExerciseToRoutine = useCallback((routineId: string, exerciseId: string) => {
    const entry = makeEntry(exerciseId);
    if (!entry) return false;
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine;
        const exercises = [...routine.exercises, entry];
        return {
          ...routine,
          exercises,
          estimatedMinutes: estimateMinutes(exercises),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    return true;
  }, []);

  const createRoutineWithExercise = useCallback((name: string, exerciseId: string) => {
    const entry = makeEntry(exerciseId);
    if (!entry) return null;
    const exercise = getExerciseById(exerciseId);
    const id = `routine-${Date.now()}`;
    const routine: Routine = {
      id,
      name: name.trim() || 'New Routine',
      exercises: [entry],
      estimatedMinutes: estimateMinutes([entry]),
      focus: exercise?.muscleGroup ?? 'Full Body',
      updatedAt: new Date().toISOString(),
    };
    setRoutines((prev) => [routine, ...prev]);
    return id;
  }, []);

  const value = useMemo<RoutinesContextValue>(
    () => ({ routines, addExerciseToRoutine, createRoutineWithExercise }),
    [routines, addExerciseToRoutine, createRoutineWithExercise]
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
