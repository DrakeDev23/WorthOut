import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { Routine } from '@/types/models';
import type { ActiveWorkout } from '@/types/workout';
import {
  completeCurrentSet,
  createActiveWorkout,
  finish,
  goToExercise as goToExercisePure,
  moveRelative,
  pause,
  resume,
  skipExerciseAt,
  skipRest as skipRestPure,
} from '@/features/workout/session';

interface StartResult {
  ok: boolean;
  reason?: 'empty' | 'missing';
}

interface WorkoutContextValue {
  workout: ActiveWorkout | null;
  startWorkout: (routine: Routine | undefined) => StartResult;
  completeSet: () => void;
  skipRest: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  goToExercise: (index: number) => void;
  nextExercise: () => void;
  previousExercise: () => void;
  skipExercise: (index: number) => void;
  finishWorkout: () => void;
  discardWorkout: () => void;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);

  const startWorkout = useCallback((routine: Routine | undefined): StartResult => {
    if (!routine) return { ok: false, reason: 'missing' };
    if (routine.exercises.length === 0) return { ok: false, reason: 'empty' };
    setWorkout(createActiveWorkout(routine));
    return { ok: true };
  }, []);

  const discardWorkout = useCallback(() => setWorkout(null), []);

  const completeSet = useCallback(() => {
    setWorkout((prev) => (prev ? completeCurrentSet(prev) : prev));
  }, []);

  const skipRest = useCallback(() => {
    setWorkout((prev) => (prev ? skipRestPure(prev) : prev));
  }, []);

  const pauseWorkout = useCallback(() => {
    setWorkout((prev) => (prev ? pause(prev) : prev));
  }, []);

  const resumeWorkout = useCallback(() => {
    setWorkout((prev) => (prev ? resume(prev) : prev));
  }, []);

  const goToExercise = useCallback((index: number) => {
    setWorkout((prev) => (prev ? goToExercisePure(prev, index) : prev));
  }, []);

  const nextExercise = useCallback(() => {
    setWorkout((prev) => (prev ? moveRelative(prev, 1) : prev));
  }, []);

  const previousExercise = useCallback(() => {
    setWorkout((prev) => (prev ? moveRelative(prev, -1) : prev));
  }, []);

  const skipExercise = useCallback((index: number) => {
    setWorkout((prev) => (prev ? skipExerciseAt(prev, index) : prev));
  }, []);

  const finishWorkout = useCallback(() => {
    setWorkout((prev) => (prev ? finish(prev) : prev));
  }, []);

  const value = useMemo<WorkoutContextValue>(
    () => ({
      workout,
      startWorkout,
      completeSet,
      skipRest,
      pauseWorkout,
      resumeWorkout,
      goToExercise,
      nextExercise,
      previousExercise,
      skipExercise,
      finishWorkout,
      discardWorkout,
    }),
    [
      workout,
      startWorkout,
      completeSet,
      skipRest,
      pauseWorkout,
      resumeWorkout,
      goToExercise,
      nextExercise,
      previousExercise,
      skipExercise,
      finishWorkout,
      discardWorkout,
    ]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout(): WorkoutContextValue {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider.');
  }
  return context;
}
