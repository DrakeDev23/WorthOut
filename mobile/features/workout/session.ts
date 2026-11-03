import { getExerciseById } from '@/data';
import type { CompletedExercise, CompletedSet, Routine, WorkoutSession } from '@/types/models';
import type {
  ActiveExercise,
  ActiveSet,
  ActiveWorkout,
  RestState,
  WorkoutSummary,
} from '@/types/workout';

let sessionSeq = 0;
function nextSessionId(): string {
  sessionSeq += 1;
  return `session-${Date.now()}-${sessionSeq}`;
}

export function createActiveWorkout(routine: Routine, now: number = Date.now()): ActiveWorkout {
  const exercises: ActiveExercise[] = routine.exercises.map((entry) => {
    const exercise = getExerciseById(entry.exerciseId);
    const isHold = entry.durationSeconds != null;
    const sets: ActiveSet[] = Array.from({ length: Math.max(1, entry.sets) }, () => ({
      targetReps: entry.reps,
      targetDurationSeconds: entry.durationSeconds,
      completed: false,
    }));

    return {
      entryId: entry.entryId,
      exerciseId: entry.exerciseId,
      name: exercise?.name ?? 'Exercise',
      muscleGroup: exercise?.muscleGroup ?? 'Full Body',
      secondaryMuscles: exercise ? [...exercise.secondaryMuscles] : [],
      equipment: exercise?.equipment ?? 'Bodyweight',
      accentColor: exercise?.accentColor ?? '#BFF800',
      isHold,
      restSeconds: entry.restSeconds,
      weightKg: entry.weightKg,
      sets,
      skipped: false,
    };
  });

  return {
    id: nextSessionId(),
    routineId: routine.id,
    routineName: routine.name,
    exercises,
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    status: 'active',
    runStartedAt: now,
    accumulatedActiveMs: 0,
    startedAt: now,
    finishedAt: null,
    rest: null,
  };
}

export function activeElapsedMs(workout: ActiveWorkout, now: number = Date.now()): number {
  const running = workout.runStartedAt != null ? now - workout.runStartedAt : 0;
  return workout.accumulatedActiveMs + Math.max(0, running);
}

export function restRemainingSeconds(rest: RestState | null, now: number = Date.now()): number {
  if (!rest) return 0;
  if (rest.remainingWhilePaused != null) return Math.max(0, rest.remainingWhilePaused);
  if (rest.endsAt == null) return 0;
  return Math.max(0, Math.ceil((rest.endsAt - now) / 1000));
}

export function isExerciseComplete(exercise: ActiveExercise): boolean {
  return !exercise.skipped && exercise.sets.every((set) => set.completed);
}

export function nextIncompleteIndex(workout: ActiveWorkout, from: number): number {
  for (let i = from; i < workout.exercises.length; i += 1) {
    const ex = workout.exercises[i];
    if (!ex.skipped && !ex.sets.every((set) => set.completed)) return i;
  }
  return -1;
}

export function hasIncompleteWork(workout: ActiveWorkout): boolean {
  return workout.exercises.some((ex) => !ex.skipped && !ex.sets.every((set) => set.completed));
}

export function computeSummary(workout: ActiveWorkout, now: number = Date.now()): WorkoutSummary {
  const totalExercises = workout.exercises.length;
  let completedExercises = 0;
  let skippedExercises = 0;
  let totalSets = 0;
  let completedSets = 0;
  let totalReps = 0;

  for (const exercise of workout.exercises) {
    if (exercise.skipped) skippedExercises += 1;
    else if (exercise.sets.every((set) => set.completed)) completedExercises += 1;

    for (const set of exercise.sets) {
      totalSets += 1;
      if (set.completed) {
        completedSets += 1;
        if (!exercise.isHold) {
          totalReps += set.actualReps ?? set.targetReps;
        }
      }
    }
  }

  const completionPercent = totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);
  const durationMs =
    workout.finishedAt != null
      ? workout.finishedAt - workout.startedAt - pausedMs(workout)
      : activeElapsedMs(workout, now);

  return {
    routineName: workout.routineName,
    durationMs: Math.max(0, durationMs),
    totalExercises,
    completedExercises,
    skippedExercises,
    totalSets,
    completedSets,
    totalReps,
    completionPercent,
    finishedAt: new Date(workout.finishedAt ?? now).toISOString(),
  };
}

function pausedMs(workout: ActiveWorkout): number {
  if (workout.finishedAt == null) return 0;
  const span = workout.finishedAt - workout.startedAt;
  return Math.max(0, span - workout.accumulatedActiveMs);
}

export function buildWorkoutSession(
  workout: ActiveWorkout,
  now: number = Date.now()
): WorkoutSession {
  const summary = computeSummary(workout, now);

  const exercises: CompletedExercise[] = [];
  for (const exercise of workout.exercises) {
    const completedSets = exercise.sets.filter((set) => set.completed);
    if (completedSets.length === 0) continue;
    const sets: CompletedSet[] = completedSets.map((set) => {
      if (exercise.isHold) {
        return {
          reps: 1,
          durationSeconds: set.actualDurationSeconds ?? set.targetDurationSeconds,
          weightKg: exercise.weightKg,
        };
      }
      return {
        reps: set.actualReps ?? set.targetReps,
        weightKg: exercise.weightKg,
      };
    });
    exercises.push({ exerciseId: exercise.exerciseId, name: exercise.name, sets });
  }

  return {
    id: workout.id,
    routineId: workout.routineId,
    routineName: workout.routineName,
    date: summary.finishedAt,
    durationMinutes: Math.max(1, Math.round(summary.durationMs / 60_000)),
    totalSets: summary.completedSets,
    exercises,
  };
}

export function freezeActiveTime(workout: ActiveWorkout, now: number): ActiveWorkout {
  const running = workout.runStartedAt != null ? Math.max(0, now - workout.runStartedAt) : 0;
  return {
    ...workout,
    accumulatedActiveMs: workout.accumulatedActiveMs + running,
    runStartedAt: null,
  };
}

function startRest(totalSeconds: number, now: number): RestState | null {
  if (totalSeconds <= 0) return null;
  return { totalSeconds, endsAt: now + totalSeconds * 1000, remainingWhilePaused: null };
}

function firstIncompleteSet(exercise: ActiveExercise): number {
  const idx = exercise.sets.findIndex((set) => !set.completed);
  return idx === -1 ? 0 : idx;
}

export function completeCurrentSet(
  workout: ActiveWorkout,
  now: number = Date.now()
): ActiveWorkout {
  if (workout.status === 'completed') return workout;

  const exercises = workout.exercises.map((exercise, exIdx) => {
    if (exIdx !== workout.currentExerciseIndex) return exercise;
    const sets = exercise.sets.map((set, setIdx) => {
      if (setIdx !== workout.currentSetIndex) return set;
      return {
        ...set,
        completed: true,
        actualReps: exercise.isHold ? undefined : set.targetReps,
        actualDurationSeconds: exercise.isHold ? set.targetDurationSeconds : undefined,
      };
    });
    return { ...exercise, sets };
  });

  const currentExercise = exercises[workout.currentExerciseIndex];
  const moreSetsHere = workout.currentSetIndex < currentExercise.sets.length - 1;

  if (moreSetsHere) {
    const rest = startRest(currentExercise.restSeconds, now);
    return {
      ...workout,
      exercises,
      currentSetIndex: workout.currentSetIndex + 1,
      status: rest ? 'resting' : 'active',
      rest,
    };
  }

  const base: ActiveWorkout = { ...workout, exercises, rest: null };
  const nextIdx = nextIncompleteIndex(base, workout.currentExerciseIndex + 1);
  if (nextIdx === -1) {
    return { ...base, status: 'active' };
  }
  const rest = startRest(exercises[nextIdx].restSeconds, now);
  return {
    ...base,
    currentExerciseIndex: nextIdx,
    currentSetIndex: 0,
    status: rest ? 'resting' : 'active',
    rest,
  };
}

export function skipRest(workout: ActiveWorkout): ActiveWorkout {
  if (workout.status !== 'resting') return workout;
  return { ...workout, status: 'active', rest: null };
}

export function pause(workout: ActiveWorkout, now: number = Date.now()): ActiveWorkout {
  if (workout.status === 'completed' || workout.status === 'paused') return workout;
  const frozen = freezeActiveTime(workout, now);
  const rest = workout.rest
    ? {
        ...workout.rest,
        remainingWhilePaused: restRemainingSeconds(workout.rest, now),
        endsAt: null,
      }
    : null;
  return { ...frozen, status: 'paused', rest };
}

export function resume(workout: ActiveWorkout, now: number = Date.now()): ActiveWorkout {
  if (workout.status !== 'paused') return workout;
  const resting = workout.rest != null && (workout.rest.remainingWhilePaused ?? 0) > 0;
  const rest =
    resting && workout.rest != null
      ? {
          ...workout.rest,
          endsAt: now + (workout.rest.remainingWhilePaused ?? 0) * 1000,
          remainingWhilePaused: null,
        }
      : null;
  return { ...workout, status: resting ? 'resting' : 'active', runStartedAt: now, rest };
}

export function goToExercise(workout: ActiveWorkout, index: number): ActiveWorkout {
  if (workout.status === 'completed') return workout;
  if (index < 0 || index >= workout.exercises.length) return workout;
  return {
    ...workout,
    currentExerciseIndex: index,
    currentSetIndex: firstIncompleteSet(workout.exercises[index]),
    status: 'active',
    rest: null,
  };
}

export function moveRelative(workout: ActiveWorkout, delta: number): ActiveWorkout {
  const index = Math.min(
    workout.exercises.length - 1,
    Math.max(0, workout.currentExerciseIndex + delta)
  );
  return {
    ...workout,
    currentExerciseIndex: index,
    currentSetIndex: firstIncompleteSet(workout.exercises[index]),
    status: 'active',
    rest: null,
  };
}

export function skipExerciseAt(workout: ActiveWorkout, index: number): ActiveWorkout {
  if (workout.status === 'completed') return workout;
  if (index < 0 || index >= workout.exercises.length) return workout;
  const exercises = workout.exercises.map((exercise, exIdx) =>
    exIdx === index ? { ...exercise, skipped: true } : exercise
  );
  const base: ActiveWorkout = { ...workout, exercises, rest: null, status: 'active' };
  const nextIdx = nextIncompleteIndex(base, 0);
  if (nextIdx === -1) return base;
  return { ...base, currentExerciseIndex: nextIdx, currentSetIndex: 0 };
}

export function finish(workout: ActiveWorkout, now: number = Date.now()): ActiveWorkout {
  if (workout.status === 'completed') return workout;
  const frozen = freezeActiveTime(workout, now);
  return { ...frozen, status: 'completed', finishedAt: now, rest: null };
}
