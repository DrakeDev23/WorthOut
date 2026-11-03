import { asc, eq } from 'drizzle-orm';

import { db as defaultDb } from '@/database/client';
import type { DrizzleDatabase } from '@/database/db-types';
import { toRoutine, toRoutineExerciseRow } from '@/database/mappers';
import { routineExercises, routines } from '@/database/schema';
import type { Routine, RoutineExercise } from '@/types/models';

export class RoutineRepository {
  constructor(private readonly db: DrizzleDatabase = defaultDb) {}

  async getAll(): Promise<Routine[]> {
    const routineRows = await this.db.select().from(routines);
    const exerciseRows = await this.db
      .select()
      .from(routineExercises)
      .orderBy(asc(routineExercises.position));

    const byRoutine = new Map<string, typeof exerciseRows>();
    for (const row of exerciseRows) {
      const list = byRoutine.get(row.routineId) ?? [];
      list.push(row);
      byRoutine.set(row.routineId, list);
    }

    return routineRows
      .map((row) => toRoutine(row, byRoutine.get(row.id) ?? []))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(routineId: string): Promise<Routine | undefined> {
    const [row] = await this.db.select().from(routines).where(eq(routines.id, routineId)).limit(1);
    if (!row) return undefined;
    const exerciseRows = await this.db
      .select()
      .from(routineExercises)
      .where(eq(routineExercises.routineId, routineId))
      .orderBy(asc(routineExercises.position));
    return toRoutine(row, exerciseRows);
  }

  async create(routine: Routine, createdAt: string = routine.updatedAt): Promise<void> {
    this.db.transaction((tx) => {
      tx.insert(routines)
        .values({
          id: routine.id,
          name: routine.name,
          description: routine.description ?? null,
          category: routine.category ?? null,
          createdAt,
          updatedAt: routine.updatedAt,
        })
        .run();
      if (routine.exercises.length > 0) {
        tx.insert(routineExercises)
          .values(
            routine.exercises.map((entry, index) => toRoutineExerciseRow(routine.id, entry, index))
          )
          .run();
      }
    });
  }

  async update(
    routineId: string,
    fields: {
      name: string;
      description?: string;
      category?: Routine['category'];
      updatedAt: string;
    }
  ): Promise<void> {
    await this.db
      .update(routines)
      .set({
        name: fields.name,
        description: fields.description ?? null,
        category: fields.category ?? null,
        updatedAt: fields.updatedAt,
      })
      .where(eq(routines.id, routineId));
  }

  async delete(routineId: string): Promise<void> {
    await this.db.delete(routines).where(eq(routines.id, routineId));
  }

  async setExercises(
    routineId: string,
    exercises: RoutineExercise[],
    updatedAt: string
  ): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(routineExercises).where(eq(routineExercises.routineId, routineId)).run();
      if (exercises.length > 0) {
        tx.insert(routineExercises)
          .values(exercises.map((entry, index) => toRoutineExerciseRow(routineId, entry, index)))
          .run();
      }
      tx.update(routines).set({ updatedAt }).where(eq(routines.id, routineId)).run();
    });
  }
}

export const routineRepository = new RoutineRepository();
