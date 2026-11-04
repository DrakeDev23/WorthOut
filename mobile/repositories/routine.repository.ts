import { and, asc, eq, isNull } from 'drizzle-orm';

import { LEGACY_LOCAL_ACCOUNT_ID } from '@/database/ids';
import { db as defaultDb } from '@/database/client';
import type { DrizzleDatabase } from '@/database/db-types';
import { toRoutine, toRoutineExerciseRow } from '@/database/mappers';
import { routineExercises, routines } from '@/database/schema';
import type { Routine, RoutineExercise } from '@/types/models';

export class RoutineRepository {
  constructor(private readonly db: DrizzleDatabase = defaultDb, private readonly accountId = LEGACY_LOCAL_ACCOUNT_ID) {}

  async getAll(): Promise<Routine[]> {
    const routineRows = await this.db.select().from(routines).where(and(eq(routines.accountId, this.accountId), isNull(routines.deletedAt)));
    const exerciseRows = await this.db.select().from(routineExercises).where(and(eq(routineExercises.accountId, this.accountId), isNull(routineExercises.deletedAt))).orderBy(asc(routineExercises.position));
    const byRoutine = new Map<string, typeof exerciseRows>();
    for (const row of exerciseRows) byRoutine.set(row.routineId, [...(byRoutine.get(row.routineId) ?? []), row]);
    return routineRows.map((row) => toRoutine(row, byRoutine.get(row.id) ?? [])).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(routineId: string): Promise<Routine | undefined> {
    const [row] = await this.db.select().from(routines).where(and(eq(routines.id, routineId), eq(routines.accountId, this.accountId), isNull(routines.deletedAt))).limit(1);
    if (!row) return undefined;
    const exerciseRows = await this.db.select().from(routineExercises).where(and(eq(routineExercises.routineId, routineId), eq(routineExercises.accountId, this.accountId), isNull(routineExercises.deletedAt))).orderBy(asc(routineExercises.position));
    return toRoutine(row, exerciseRows);
  }

  async create(routine: Routine, createdAt: string = routine.updatedAt): Promise<void> {
    this.db.transaction((tx) => {
      tx.insert(routines).values({ id: routine.id, accountId: this.accountId, name: routine.name, description: routine.description ?? null, category: routine.category ?? null, createdAt, updatedAt: routine.updatedAt, clientUpdatedAt: routine.updatedAt, syncStatus: 'pending_insert' }).run();
      if (routine.exercises.length > 0) tx.insert(routineExercises).values(routine.exercises.map((entry, index) => ({ ...toRoutineExerciseRow(routine.id, entry, index), accountId: this.accountId, clientUpdatedAt: routine.updatedAt, syncStatus: 'pending_insert' }))).run();
    });
  }

  async update(routineId: string, fields: { name: string; description?: string; category?: Routine['category']; updatedAt: string }): Promise<void> {
    await this.db.update(routines).set({ name: fields.name, description: fields.description ?? null, category: fields.category ?? null, updatedAt: fields.updatedAt, clientUpdatedAt: fields.updatedAt, syncStatus: 'pending_update' }).where(and(eq(routines.id, routineId), eq(routines.accountId, this.accountId), isNull(routines.deletedAt)));
  }

  async delete(routineId: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    await this.db.update(routines).set({ deletedAt, clientUpdatedAt: deletedAt, syncStatus: 'pending_delete' }).where(and(eq(routines.id, routineId), eq(routines.accountId, this.accountId), isNull(routines.deletedAt)));
    await this.db.update(routineExercises).set({ deletedAt, clientUpdatedAt: deletedAt, syncStatus: 'pending_delete' }).where(and(eq(routineExercises.routineId, routineId), eq(routineExercises.accountId, this.accountId), isNull(routineExercises.deletedAt)));
  }

  async setExercises(routineId: string, exercises: RoutineExercise[], updatedAt: string): Promise<void> {
    this.db.transaction((tx) => {
      tx.update(routineExercises).set({ deletedAt: updatedAt, clientUpdatedAt: updatedAt, syncStatus: 'pending_delete' }).where(and(eq(routineExercises.routineId, routineId), eq(routineExercises.accountId, this.accountId), isNull(routineExercises.deletedAt))).run();
      for (const [index, entry] of exercises.entries()) {
        const row = toRoutineExerciseRow(routineId, entry, index);
        tx.insert(routineExercises).values({ ...row, accountId: this.accountId, clientUpdatedAt: updatedAt, syncStatus: 'pending_update' }).onConflictDoUpdate({ target: routineExercises.id, set: { ...row, accountId: this.accountId, clientUpdatedAt: updatedAt, syncStatus: 'pending_update', deletedAt: null } }).run();
      }
      tx.update(routines).set({ updatedAt, clientUpdatedAt: updatedAt, syncStatus: 'pending_update' }).where(and(eq(routines.id, routineId), eq(routines.accountId, this.accountId), isNull(routines.deletedAt))).run();
    });
  }
}

export const routineRepository = new RoutineRepository();
