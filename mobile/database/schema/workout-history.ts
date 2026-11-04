import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { localAccounts } from './accounts';

export const workoutHistory = sqliteTable(
  'workout_history',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull().references(() => localAccounts.id),
    routineId: text('routine_id'),
    routineNameSnapshot: text('routine_name_snapshot').notNull(),
    date: text('date').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    totalSets: integer('total_sets').notNull(),
    syncStatus: text('sync_status').notNull().default('synced'),
    clientUpdatedAt: text('client_updated_at').notNull(),
    lastSyncedAt: text('last_synced_at'),
    serverVersion: integer('server_version').notNull().default(0),
    serverUpdatedAt: text('server_updated_at'),
    deletedAt: text('deleted_at'),
  },
  (table) => ({
    dateIdx: index('workout_history_date_idx').on(table.date),
  })
);

export const workoutHistoryExercises = sqliteTable(
  'workout_history_exercises',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull().references(() => localAccounts.id),
    sessionId: text('session_id')
      .notNull()
      .references(() => workoutHistory.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id').notNull(),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    syncStatus: text('sync_status').notNull().default('synced'),
    clientUpdatedAt: text('client_updated_at').notNull(),
    lastSyncedAt: text('last_synced_at'),
    serverVersion: integer('server_version').notNull().default(0),
    serverUpdatedAt: text('server_updated_at'),
    deletedAt: text('deleted_at'),
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
    accountId: text('account_id').notNull().references(() => localAccounts.id),
    exerciseRef: text('exercise_ref')
      .notNull()
      .references(() => workoutHistoryExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    reps: integer('reps').notNull(),
    weightKg: real('weight_kg'),
    durationSeconds: integer('duration_seconds'),
    syncStatus: text('sync_status').notNull().default('synced'),
    clientUpdatedAt: text('client_updated_at').notNull(),
    lastSyncedAt: text('last_synced_at'),
    serverVersion: integer('server_version').notNull().default(0),
    serverUpdatedAt: text('server_updated_at'),
    deletedAt: text('deleted_at'),
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
