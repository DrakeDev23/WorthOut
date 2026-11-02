import type { MuscleGroup } from './models';

export interface ActiveSet {
  targetReps: number;
  targetDurationSeconds?: number;
  completed: boolean;
  actualReps?: number;
  actualDurationSeconds?: number;
}

export interface ActiveExercise {
  entryId: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  accentColor: string;
  isHold: boolean;
  restSeconds: number;
  weightKg?: number;
  sets: ActiveSet[];
  skipped: boolean;
}

export type WorkoutStatus = 'active' | 'paused' | 'resting' | 'completed';

export interface RestState {
  totalSeconds: number;
  endsAt: number | null;
  remainingWhilePaused: number | null;
}

export interface ActiveWorkout {
  id: string;
  routineId: string;
  routineName: string;
  exercises: ActiveExercise[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  status: WorkoutStatus;

  runStartedAt: number | null;
  accumulatedActiveMs: number;
  startedAt: number;
  finishedAt: number | null;

  rest: RestState | null;
}

export interface WorkoutSummary {
  routineName: string;
  durationMs: number;
  totalExercises: number;
  completedExercises: number;
  skippedExercises: number;
  totalSets: number;
  completedSets: number;
  totalReps: number;
  completionPercent: number;
  finishedAt: string;
}
