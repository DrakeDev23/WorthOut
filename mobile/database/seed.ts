import { ROUTINES } from '@/data';

import { RoutineRepository } from '@/repositories/routine.repository';
import { db as defaultDb } from './client';
import type { DrizzleDatabase } from './db-types';
import { routines } from './schema';

export async function seedDefaultRoutinesIfEmpty(
  db: DrizzleDatabase = defaultDb
): Promise<boolean> {
  const existing = await db.select({ id: routines.id }).from(routines).limit(1);
  if (existing.length > 0) return false;

  const repository = new RoutineRepository(db);
  for (const routine of ROUTINES) {
    await repository.create(routine, routine.updatedAt);
  }
  return true;
}
