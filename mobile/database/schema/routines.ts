import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const routineExercises = sqliteTable(
  'routine_exercises',
  {
    id: text('id').primaryKey(),
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
  },
  (table) => ({
    routinePositionIdx: index('routine_exercises_routine_position_idx').on(
      table.routineId,
      table.position
    ),
  })
);

export type RoutineRow = typeof routines.$inferSelect;
export type RoutineInsert = typeof routines.$inferInsert;
export type RoutineExerciseRow = typeof routineExercises.$inferSelect;
export type RoutineExerciseInsert = typeof routineExercises.$inferInsert;
