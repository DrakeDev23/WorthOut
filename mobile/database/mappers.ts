import { deriveFocus, estimateMinutes } from '@/features/routine-derive';
import type {
  CompletedExercise,
  CompletedSet,
  Routine,
  RoutineExercise,
  WorkoutSession,
} from '@/types/models';

import type {
  RoutineExerciseRow,
  RoutineRow,
  WorkoutHistoryExerciseRow,
  WorkoutHistoryRow,
  WorkoutHistorySetRow,
} from './schema';

export function toRoutineExercise(row: RoutineExerciseRow): RoutineExercise {
  return {
    entryId: row.id,
    exerciseId: row.exerciseId,
    sets: row.sets,
    reps: row.reps,
    durationSeconds: row.durationSeconds ?? undefined,
    weightKg: row.weightKg ?? undefined,
    restSeconds: row.restSeconds,
  };
}

export function toRoutine(row: RoutineRow, exerciseRows: RoutineExerciseRow[]): Routine {
  const ordered = [...exerciseRows].sort((a, b) => a.position - b.position);
  const exercises = ordered.map(toRoutineExercise);
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    category: (row.category as Routine['category']) ?? undefined,
    exercises,
    estimatedMinutes: estimateMinutes(exercises),
    focus: deriveFocus(exercises),
    updatedAt: row.updatedAt,
  };
}

export function toRoutineExerciseRow(
  routineId: string,
  entry: RoutineExercise,
  position: number
): RoutineExerciseRow {
  return {
    id: entry.entryId,
    routineId,
    exerciseId: entry.exerciseId,
    position,
    sets: entry.sets,
    reps: entry.reps,
    durationSeconds: entry.durationSeconds ?? null,
    weightKg: entry.weightKg ?? null,
    restSeconds: entry.restSeconds,
  };
}

export function toWorkoutSession(
  header: WorkoutHistoryRow,
  exerciseRows: WorkoutHistoryExerciseRow[],
  setsByExercise: Map<string, WorkoutHistorySetRow[]>
): WorkoutSession {
  const orderedExercises = [...exerciseRows].sort((a, b) => a.position - b.position);
  const exercises: CompletedExercise[] = orderedExercises.map((exRow) => {
    const setRows = [...(setsByExercise.get(exRow.id) ?? [])].sort(
      (a, b) => a.position - b.position
    );
    const sets: CompletedSet[] = setRows.map((s) => ({
      reps: s.reps,
      weightKg: s.weightKg ?? undefined,
      durationSeconds: s.durationSeconds ?? undefined,
    }));
    return { exerciseId: exRow.exerciseId, name: exRow.name, sets };
  });

  return {
    id: header.id,
    routineId: header.routineId ?? '',
    routineName: header.routineNameSnapshot,
    date: header.date,
    durationMinutes: header.durationMinutes,
    totalSets: header.totalSets,
    exercises,
  };
}
