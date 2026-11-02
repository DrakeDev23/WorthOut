import { getExerciseById } from '@/data';
import type { MuscleGroup } from '@/types/models';

export function resolveMuscleGroup(exerciseId: string): MuscleGroup | null {
  return getExerciseById(exerciseId)?.muscleGroup ?? null;
}
