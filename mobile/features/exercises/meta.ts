import type { IconName } from '@/components/ui/Icon';
import { colors } from '@/constants/theme';
import type { Difficulty, Equipment, MuscleGroup } from '@/types/models';

export const MUSCLE_ICONS: Record<MuscleGroup, IconName> = {
  Chest: 'body-outline',
  Back: 'body-outline',
  Shoulders: 'barbell-outline',
  Arms: 'barbell-outline',
  Legs: 'walk-outline',
  Glutes: 'walk-outline',
  Core: 'fitness-outline',
  'Full Body': 'accessibility-outline',
  Cardio: 'heart-outline',
};

export const EQUIPMENT_ICONS: Record<Equipment, IconName> = {
  Bodyweight: 'accessibility-outline',
  Dumbbells: 'barbell-outline',
  'Resistance Bands': 'git-commit-outline',
  Kettlebells: 'fitness-outline',
  'Pull-up Bar': 'remove-outline',
  'Exercise Mat': 'square-outline',
  'Weight Plates': 'ellipse-outline',
  'Workout Bench': 'bed-outline',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Beginner: colors.success,
  Intermediate: colors.info,
  Advanced: colors.accent,
};
