import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { workoutRepository } from '@/repositories/workout.repository';
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

  isHydrating: boolean;

  recovered: boolean;
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
  const [isHydrating, setIsHydrating] = useState(true);
  const [recovered, setRecovered] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    workoutRepository
      .getActiveSession()
      .then((saved) => {
        if (cancelled) return;
        if (saved && saved.status !== 'completed') {
          setWorkout(saved);
          setRecovered(true);
        } else if (saved) {
          workoutRepository.deleteActiveSession().catch(() => undefined);
        }
        setIsHydrating(false);
      })
      .catch((error) => {
        console.error('[workout] failed to recover session:', error);
        if (!cancelled) setIsHydrating(false);
      });
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const scheduleSave = useCallback((next: ActiveWorkout) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      workoutRepository.saveActiveSession(next).catch((error) => {
        console.error('[workout] failed to persist active session:', error);
      });
    }, 250);
  }, []);

  const clearSaved = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    workoutRepository.deleteActiveSession().catch((error) => {
      console.error('[workout] failed to delete active session:', error);
    });
  }, []);

  const applyAndPersist = useCallback(
    (transition: (current: ActiveWorkout) => ActiveWorkout) => {
      setWorkout((prev) => {
        if (!prev) return prev;
        const next = transition(prev);
        if (next !== prev) scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const startWorkout = useCallback(
    (routine: Routine | undefined): StartResult => {
      if (!routine) return { ok: false, reason: 'missing' };
      if (routine.exercises.length === 0) return { ok: false, reason: 'empty' };
      const next = createActiveWorkout(routine);
      setRecovered(false);
      setWorkout(next);
      scheduleSave(next);
      return { ok: true };
    },
    [scheduleSave]
  );

  const discardWorkout = useCallback(() => {
    setWorkout(null);
    setRecovered(false);
    clearSaved();
  }, [clearSaved]);

  const completeSet = useCallback(() => applyAndPersist(completeCurrentSet), [applyAndPersist]);
  const skipRest = useCallback(() => applyAndPersist(skipRestPure), [applyAndPersist]);
  const pauseWorkout = useCallback(() => applyAndPersist(pause), [applyAndPersist]);
  const resumeWorkout = useCallback(() => applyAndPersist(resume), [applyAndPersist]);
  const goToExercise = useCallback(
    (index: number) => applyAndPersist((w) => goToExercisePure(w, index)),
    [applyAndPersist]
  );
  const nextExercise = useCallback(
    () => applyAndPersist((w) => moveRelative(w, 1)),
    [applyAndPersist]
  );
  const previousExercise = useCallback(
    () => applyAndPersist((w) => moveRelative(w, -1)),
    [applyAndPersist]
  );
  const skipExercise = useCallback(
    (index: number) => applyAndPersist((w) => skipExerciseAt(w, index)),
    [applyAndPersist]
  );

  const finishWorkout = useCallback(() => {
    setWorkout((prev) => {
      if (!prev) return prev;
      const next = finish(prev);
      clearSaved();
      return next;
    });
    setRecovered(false);
  }, [clearSaved]);

  const value = useMemo<WorkoutContextValue>(
    () => ({
      workout,
      isHydrating,
      recovered,
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
      isHydrating,
      recovered,
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
