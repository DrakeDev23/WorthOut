import { HistoryRepository } from '@/repositories/history.repository';
import { RoutineRepository } from '@/repositories/routine.repository';
import type { Routine, WorkoutSession } from '@/types/models';

import { createTestDatabase, type TestDatabase } from './helpers/test-db';

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 's1',
    routineId: 'r1',
    routineName: 'Full Body Workout',
    date: '2026-10-31T07:30:00.000Z',
    durationMinutes: 44,
    totalSets: 2,
    exercises: [
      {
        exerciseId: 'ex-squat',
        name: 'Bodyweight Squat',
        sets: [{ reps: 15 }, { reps: 14 }],
      },
      {
        exerciseId: 'ex-plank',
        name: 'Plank',
        sets: [{ reps: 1, durationSeconds: 45 }],
      },
    ],
    ...overrides,
  };
}

function makeRoutine(): Routine {
  return {
    id: 'r1',
    name: 'Full Body Workout',
    exercises: [{ entryId: 'e1', exerciseId: 'ex-squat', sets: 3, reps: 15, restSeconds: 60 }],
    estimatedMinutes: 20,
    focus: 'Full Body',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('HistoryRepository (real SQLite via better-sqlite3)', () => {
  let db: TestDatabase;
  let history: HistoryRepository;
  let routines: RoutineRepository;

  beforeEach(() => {
    ({ db } = createTestDatabase());
    history = new HistoryRepository(db);
    routines = new RoutineRepository(db);
  });

  it('saves and reads back a completed workout snapshot', async () => {
    const saved = await history.saveCompletedWorkout(makeSession());
    expect(saved).toBe(true);

    const all = await history.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].routineName).toBe('Full Body Workout');
    expect(all[0].exercises).toHaveLength(2);
    expect(all[0].exercises[0].sets).toHaveLength(2);
    expect(all[0].exercises[1].sets[0].durationSeconds).toBe(45);
  });

  it('prevents duplicate history entries by id', async () => {
    expect(await history.saveCompletedWorkout(makeSession())).toBe(true);

    expect(await history.saveCompletedWorkout(makeSession())).toBe(false);
    expect(await history.getAll()).toHaveLength(1);
  });

  it('preserves ordering of exercises and sets', async () => {
    await history.saveCompletedWorkout(makeSession());
    const session = await history.getById('s1');
    expect(session?.exercises.map((e) => e.exerciseId)).toEqual(['ex-squat', 'ex-plank']);
    expect(session?.exercises[0].sets.map((s) => s.reps)).toEqual([15, 14]);
  });

  it('keeps historical snapshot after the source routine is edited', async () => {
    await routines.create(makeRoutine());
    await history.saveCompletedWorkout(makeSession());

    await routines.update('r1', {
      name: 'Completely Different Name',
      updatedAt: '2026-12-01T00:00:00.000Z',
    });

    const session = await history.getById('s1');

    expect(session?.routineName).toBe('Full Body Workout');
  });

  it('keeps historical snapshot after the source routine is deleted', async () => {
    await routines.create(makeRoutine());
    await history.saveCompletedWorkout(makeSession());

    await routines.delete('r1');

    const session = await history.getById('s1');
    expect(session).toBeDefined();
    expect(session?.routineName).toBe('Full Body Workout');
    expect(session?.exercises).toHaveLength(2);
  });

  it('filters by date range', async () => {
    await history.saveCompletedWorkout(makeSession({ id: 'a', date: '2026-10-01T00:00:00.000Z' }));
    await history.saveCompletedWorkout(makeSession({ id: 'b', date: '2026-10-15T00:00:00.000Z' }));
    await history.saveCompletedWorkout(makeSession({ id: 'c', date: '2026-11-01T00:00:00.000Z' }));

    const range = await history.getByDateRange(
      '2026-10-10T00:00:00.000Z',
      '2026-10-31T23:59:59.000Z'
    );
    expect(range.map((s) => s.id)).toEqual(['b']);
  });
});
