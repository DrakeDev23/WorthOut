import type { IconName } from '@/components/ui/Icon';
import type { RoutineCategory } from '@/types/models';

export const ROUTINE_CATEGORIES: RoutineCategory[] = [
  'Full Body',
  'Upper Body',
  'Lower Body',
  'Push',
  'Pull',
  'Legs',
];

export const CATEGORY_ICONS: Record<RoutineCategory, IconName> = {
  'Full Body': 'accessibility-outline',
  'Upper Body': 'body-outline',
  'Lower Body': 'walk-outline',
  Push: 'arrow-up-circle-outline',
  Pull: 'arrow-down-circle-outline',
  Legs: 'walk-outline',
};
