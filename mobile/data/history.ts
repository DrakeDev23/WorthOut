import type { WorkoutSession } from '@/types/models';

export const WORKOUT_HISTORY: WorkoutSession[] = [
  {
    id: 'session-1',
    routineId: 'routine-full-body',
    routineName: 'Full Body Workout',
    date: '2026-10-31T07:30:00.000Z',
    durationMinutes: 44,
    totalSets: 13,
    exercises: [
      {
        exerciseId: 'ex-squat',
        name: 'Bodyweight Squat',
        sets: [{ reps: 15 }, { reps: 15 }, { reps: 14 }],
      },
      {
        exerciseId: 'ex-pushup',
        name: 'Push-Up',
        sets: [{ reps: 12 }, { reps: 12 }, { reps: 10 }],
      },
      {
        exerciseId: 'ex-db-row',
        name: 'Dumbbell Row',
        sets: [
          { reps: 10, weightKg: 12 },
          { reps: 10, weightKg: 12 },
          { reps: 9, weightKg: 12 },
        ],
      },
      {
        exerciseId: 'ex-plank',
        name: 'Plank',
        sets: [
          { reps: 1, durationSeconds: 45 },
          { reps: 1, durationSeconds: 45 },
          { reps: 1, durationSeconds: 40 },
        ],
      },
    ],
  },
  {
    id: 'session-2',
    routineId: 'routine-push',
    routineName: 'Push Day',
    date: '2026-10-29T18:10:00.000Z',
    durationMinutes: 39,
    totalSets: 11,
    exercises: [
      {
        exerciseId: 'ex-bench-press',
        name: 'Bench Dumbbell Press',
        sets: [
          { reps: 10, weightKg: 14 },
          { reps: 10, weightKg: 14 },
          { reps: 9, weightKg: 14 },
          { reps: 8, weightKg: 14 },
        ],
      },
      {
        exerciseId: 'ex-db-press',
        name: 'Dumbbell Shoulder Press',
        sets: [
          { reps: 10, weightKg: 10 },
          { reps: 10, weightKg: 10 },
          { reps: 9, weightKg: 10 },
          { reps: 8, weightKg: 10 },
        ],
      },
      {
        exerciseId: 'ex-pushup',
        name: 'Push-Up',
        sets: [{ reps: 15 }, { reps: 13 }, { reps: 12 }],
      },
    ],
  },
  {
    id: 'session-3',
    routineId: 'routine-lower',
    routineName: 'Lower Body Workout',
    date: '2026-10-27T06:45:00.000Z',
    durationMinutes: 36,
    totalSets: 14,
    exercises: [
      {
        exerciseId: 'ex-plate-squat',
        name: 'Goblet Plate Squat',
        sets: [
          { reps: 12, weightKg: 15 },
          { reps: 12, weightKg: 15 },
          { reps: 11, weightKg: 15 },
          { reps: 10, weightKg: 15 },
        ],
      },
      {
        exerciseId: 'ex-lunge',
        name: 'Walking Lunge',
        sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }],
      },
      {
        exerciseId: 'ex-kb-swing',
        name: 'Kettlebell Swing',
        sets: [
          { reps: 15, weightKg: 12 },
          { reps: 15, weightKg: 12 },
          { reps: 15, weightKg: 12 },
          { reps: 14, weightKg: 12 },
        ],
      },
      {
        exerciseId: 'ex-glute-bridge',
        name: 'Glute Bridge',
        sets: [{ reps: 15 }, { reps: 15 }, { reps: 15 }],
      },
    ],
  },
  {
    id: 'session-4',
    routineId: 'routine-pull',
    routineName: 'Pull Day',
    date: '2026-10-25T17:20:00.000Z',
    durationMinutes: 41,
    totalSets: 13,
    exercises: [
      {
        exerciseId: 'ex-pullup',
        name: 'Pull-Up',
        sets: [{ reps: 6 }, { reps: 6 }, { reps: 5 }],
      },
      {
        exerciseId: 'ex-db-row',
        name: 'Dumbbell Row',
        sets: [
          { reps: 10, weightKg: 14 },
          { reps: 10, weightKg: 14 },
          { reps: 10, weightKg: 14 },
          { reps: 9, weightKg: 14 },
        ],
      },
      {
        exerciseId: 'ex-band-pull',
        name: 'Band Pull-Apart',
        sets: [{ reps: 18 }, { reps: 18 }, { reps: 18 }],
      },
      {
        exerciseId: 'ex-bicep-curl',
        name: 'Dumbbell Bicep Curl',
        sets: [
          { reps: 12, weightKg: 8 },
          { reps: 12, weightKg: 8 },
          { reps: 11, weightKg: 8 },
        ],
      },
    ],
  },
  {
    id: 'session-5',
    routineId: 'routine-core',
    routineName: 'Core Workout',
    date: '2026-10-23T20:05:00.000Z',
    durationMinutes: 23,
    totalSets: 9,
    exercises: [
      {
        exerciseId: 'ex-plank',
        name: 'Plank',
        sets: [
          { reps: 1, durationSeconds: 45 },
          { reps: 1, durationSeconds: 45 },
          { reps: 1, durationSeconds: 45 },
        ],
      },
      {
        exerciseId: 'ex-mountain-climber',
        name: 'Mountain Climbers',
        sets: [{ reps: 30 }, { reps: 30 }, { reps: 28 }],
      },
      {
        exerciseId: 'ex-glute-bridge',
        name: 'Glute Bridge',
        sets: [{ reps: 15 }, { reps: 15 }, { reps: 15 }],
      },
    ],
  },
];
