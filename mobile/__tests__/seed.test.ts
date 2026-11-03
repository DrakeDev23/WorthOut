import { ROUTINES } from '@/data';
import { seedDefaultRoutinesIfEmpty } from '@/database/seed';
import { HistoryRepository } from '@/repositories/history.repository';
import { RoutineRepository } from '@/repositories/routine.repository';

import { createTestDatabase, type TestDatabase } from './helpers/test-db';

describe('first-launch seeding (real SQLite via better-sqlite3)', () => {
  let db: TestDatabase;

  beforeEach(() => {
    ({ db } = createTestDatabase());
  });

  it('seeds the default routines into an empty database', async () => {
    const ran = await seedDefaultRoutinesIfEmpty(db);
    expect(ran).toBe(true);

    const routines = await new RoutineRepository(db).getAll();
    expect(routines).toHaveLength(ROUTINES.length);

    expect(routines.some((r) => r.id === 'routine-full-body')).toBe(true);
  });

  it('does not seed history (first-time users start empty)', async () => {
    await seedDefaultRoutinesIfEmpty(db);
    const history = await new HistoryRepository(db).getAll();
    expect(history).toHaveLength(0);
  });

  it('is idempotent: re-running does not duplicate routines', async () => {
    expect(await seedDefaultRoutinesIfEmpty(db)).toBe(true);
    expect(await seedDefaultRoutinesIfEmpty(db)).toBe(false);

    const routines = await new RoutineRepository(db).getAll();
    expect(routines).toHaveLength(ROUTINES.length);
  });

  it('preserves default routine exercises and their order', async () => {
    await seedDefaultRoutinesIfEmpty(db);
    const seeded = await new RoutineRepository(db).getById('routine-full-body');
    const original = ROUTINES.find((r) => r.id === 'routine-full-body');
    expect(seeded?.exercises.map((e) => e.exerciseId)).toEqual(
      original?.exercises.map((e) => e.exerciseId)
    );
  });
});
