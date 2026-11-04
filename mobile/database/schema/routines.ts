import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { localAccounts } from './accounts';

export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => localAccounts.id),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  syncStatus: text('sync_status').notNull().default('synced'),
  clientUpdatedAt: text('client_updated_at').notNull(),
  lastSyncedAt: text('last_synced_at'),
  serverVersion: integer('server_version').notNull().default(0),
  serverUpdatedAt: text('server_updated_at'),
  deletedAt: text('deleted_at'),
});

export const routineExercises = sqliteTable(
  'routine_exercises',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull().references(() => localAccounts.id),
    routineId: text('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id').notNull(),
    position: integer('position').notNull(),
    sets: integer('sets').notNull(),
    reps: integer('reps').notNull(),
    durationSeconds: integer('duration_seconds'),
    weightKg: real('weight_kg'),
    restSeconds: integer('rest_seconds').notNull(),
    syncStatus: text('sync_status').notNull().default('synced'),
    clientUpdatedAt: text('client_updated_at').notNull(),
    lastSyncedAt: text('last_synced_at'),
    serverVersion: integer('server_version').notNull().default(0),
    serverUpdatedAt: text('server_updated_at'),
    deletedAt: text('deleted_at'),
  },
  (table) => ({
    routinePositionIdx: index('routine_exercises_routine_position_idx').on(
      table.routineId,
      table.position
    ),
    routineSyncIdx: index('routine_exercises_account_sync_idx').on(table.accountId, table.syncStatus),
  })
);

export type RoutineRow = typeof routines.$inferSelect;
export type RoutineInsert = typeof routines.$inferInsert;
export type RoutineExerciseRow = typeof routineExercises.$inferSelect;
export type RoutineExerciseInsert = typeof routineExercises.$inferInsert;
