import { getExerciseById } from '@/data';
import type { MuscleGroup, Routine, RoutineExercise } from '@/types/models';

export function estimateMinutes(exercises: RoutineExercise[]): number {
  if (exercises.length === 0) return 0;
  const seconds = exercises.reduce((total, item) => {
    const workSeconds = (item.durationSeconds ?? 40) * item.sets;
    const restSeconds = item.restSeconds * item.sets;
    return total + workSeconds + restSeconds;
  }, 0);
  return Math.max(5, Math.round(seconds / 60));
}

export function deriveFocus(
  exercises: RoutineExercise[],
  fallback: MuscleGroup = 'Full Body'
): MuscleGroup {
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
