import type { RoutineExercise } from '@/types/models';

export function effortLabel(entry: RoutineExercise): string {
  if (entry.durationSeconds != null) {
    return `${entry.durationSeconds}s hold`;
  }
  return `${entry.reps} ${entry.reps === 1 ? 'rep' : 'reps'}`;
}

export function entrySummary(entry: RoutineExercise): string {
  const parts = [`${entry.sets} × ${effortLabel(entry)}`];
  if (entry.weightKg != null) parts.push(`${entry.weightKg}kg`);
  parts.push(`${entry.restSeconds}s rest`);
  return parts.join(' · ');
}

export function isHold(entry: RoutineExercise): boolean {
  return entry.durationSeconds != null;
}
