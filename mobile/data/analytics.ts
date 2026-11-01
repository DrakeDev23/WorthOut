import type { PersonalRecord, WeeklyActivityPoint } from '@/types/models';

export const WEEKLY_ACTIVITY: WeeklyActivityPoint[] = [
  { day: 'Mon', minutes: 44, completed: true },
  { day: 'Tue', minutes: 0, completed: false },
  { day: 'Wed', minutes: 39, completed: true },
  { day: 'Thu', minutes: 36, completed: true },
  { day: 'Fri', minutes: 0, completed: false },
  { day: 'Sat', minutes: 41, completed: true },
  { day: 'Sun', minutes: 23, completed: true },
];

export const MONTHLY_ACTIVITY: { label: string; workouts: number }[] = [
  { label: 'Wk 1', workouts: 4 },
  { label: 'Wk 2', workouts: 5 },
  { label: 'Wk 3', workouts: 3 },
  { label: 'Wk 4', workouts: 5 },
];

export const PERSONAL_RECORDS: PersonalRecord[] = [
  { exerciseName: 'Pull-Up', value: '6 reps', achievedAt: '2026-10-25T00:00:00.000Z' },
  {
    exerciseName: 'Bench Dumbbell Press',
    value: '14 kg x 10',
    achievedAt: '2026-10-29T00:00:00.000Z',
  },
  { exerciseName: 'Plank', value: '45 s hold', achievedAt: '2026-10-31T00:00:00.000Z' },
  { exerciseName: 'Kettlebell Swing', value: '12 kg x 15', achievedAt: '2026-10-27T00:00:00.000Z' },
];

export interface ProgressSummary {
  totalWorkouts: number;
  totalMinutes: number;
  currentStreak: number;
  weeklyFrequency: number;
}

export const PROGRESS_SUMMARY: ProgressSummary = {
  totalWorkouts: 48,
  totalMinutes: 1864,
  currentStreak: 3,
  weeklyFrequency: 5,
};

export const DURATION_TREND: { label: string; minutes: number }[] = [
  { label: 'S1', minutes: 23 },
  { label: 'S2', minutes: 41 },
  { label: 'S3', minutes: 36 },
  { label: 'S4', minutes: 39 },
  { label: 'S5', minutes: 44 },
];
