import type { MuscleGroup } from '@/types/models';
import type { DayKey } from './date-utils';

export interface ProgressTotals {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalMinutes: number;
}

export interface DayActivity {
  key: DayKey;
  workouts: number;
  sets: number;
  minutes: number;
}

export interface WeekdayActivity {
  index: number;
  label: string;
  workouts: number;
  minutes: number;
  isToday: boolean;
}

export interface MonthActivity {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalMinutes: number;
}

export interface DurationTrendPoint {
  weekStart: Date;
  label: string;
  minutes: number;
  hasActivity: boolean;
}

export interface MuscleDistributionSlice {
  muscleGroup: MuscleGroup | 'Unknown';
  sets: number;
  fraction: number;
}
