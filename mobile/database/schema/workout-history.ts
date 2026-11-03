import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const workoutHistory = sqliteTable(
  'workout_history',
  {
    id: text('id').primaryKey(),
    routineId: text('routine_id'),
    routineNameSnapshot: text('routine_name_snapshot').notNull(),
    date: text('date').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    totalSets: integer('total_sets').notNull(),
  },
  (table) => ({
    dateIdx: index('workout_history_date_idx').on(table.date),
  })
);

export const workoutHistoryExercises = sqliteTable(
  'workout_history_exercises',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => workoutHistory.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id').notNull(),
    name: text('name').notNull(),
    position: integer('position').notNull(),
  },
  (table) => ({
    sessionPositionIdx: index('workout_history_exercises_session_position_idx').on(
      table.sessionId,
      table.position
    ),
  })
);

export const workoutHistorySets = sqliteTable(
  'workout_history_sets',
  {
    id: text('id').primaryKey(),
    exerciseRef: text('exercise_ref')
      .notNull()
      .references(() => workoutHistoryExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    reps: integer('reps').notNull(),
    weightKg: real('weight_kg'),
    durationSeconds: integer('duration_seconds'),
  },
  (table) => ({
    exercisePositionIdx: index('workout_history_sets_exercise_position_idx').on(
      table.exerciseRef,
      table.position
    ),
  })
);

export type WorkoutHistoryRow = typeof workoutHistory.$inferSelect;
export type WorkoutHistoryInsert = typeof workoutHistory.$inferInsert;
export type WorkoutHistoryExerciseRow = typeof workoutHistoryExercises.$inferSelect;
export type WorkoutHistorySetRow = typeof workoutHistorySets.$inferSelect;
