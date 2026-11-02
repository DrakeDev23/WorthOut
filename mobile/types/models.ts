export type MuscleGroup =
  'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Glutes' | 'Core' | 'Full Body' | 'Cardio';

export type Equipment =
  | 'Bodyweight'
  | 'Dumbbells'
  | 'Resistance Bands'
  | 'Kettlebells'
  | 'Pull-up Bar'
  | 'Exercise Mat'
  | 'Weight Plates'
  | 'Workout Bench';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type RoutineCategory =
  | 'Full Body'
  | 'Upper Body'
  | 'Lower Body'
  | 'Push'
  | 'Pull'
  | 'Legs';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  difficulty: Difficulty;
  description: string;
  instructions: string[];
  tips: string[];
  defaultSets: number;
  defaultReps: number;
  defaultRestSeconds: number;
  accentColor: string;
}

export interface RoutineExercise {
  entryId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  durationSeconds?: number;
  weightKg?: number;
  restSeconds: number;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  category?: RoutineCategory;
  exercises: RoutineExercise[];
  estimatedMinutes: number;
  focus: MuscleGroup;
  updatedAt: string;
}

export interface CompletedSet {
  reps: number;
  weightKg?: number;
  durationSeconds?: number;
}

export interface CompletedExercise {
  exerciseId: string;
  name: string;
  sets: CompletedSet[];
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  date: string;
  durationMinutes: number;
  exercises: CompletedExercise[];
  totalSets: number;
}

export interface WeeklyActivityPoint {
  day: string;
  minutes: number;
  completed: boolean;
}

export interface PersonalRecord {
  exerciseName: string;
  value: string;
  achievedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  preferredEquipment: Equipment[];
  fitnessGoal: string;
  weeklyGoal: number;
}
