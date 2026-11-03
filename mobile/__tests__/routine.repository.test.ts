import { RoutineRepository } from '@/repositories/routine.repository';
import type { Routine, RoutineExercise } from '@/types/models';

import { createTestDatabase, type TestDatabase } from './helpers/test-db';

function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  const exercises: RoutineExercise[] = overrides.exercises ?? [
    { entryId: 'e1', exerciseId: 'ex-squat', sets: 3, reps: 15, restSeconds: 60 },
    { entryId: 'e2', exerciseId: 'ex-pushup', sets: 3, reps: 12, restSeconds: 60 },
  ];
  return {
    id: 'r1',
    name: 'Test Routine',
    description: 'desc',
    category: 'Full Body',
    exercises,
    estimatedMinutes: 20,
    focus: 'Full Body',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('RoutineRepository (real SQLite via better-sqlite3)', () => {
  let db: TestDatabase;
  let repo: RoutineRepository;

  beforeEach(() => {
    ({ db } = createTestDatabase());
    repo = new RoutineRepository(db);
  });

  it('creates and reads back a routine with its exercises', async () => {
    await repo.create(makeRoutine());
    const all = await repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('r1');
    expect(all[0].name).toBe('Test Routine');
    expect(all[0].exercises).toHaveLength(2);

    expect(all[0].estimatedMinutes).toBeGreaterThan(0);
  });

  it('getById returns the routine or undefined', async () => {
    await repo.create(makeRoutine());
    expect((await repo.getById('r1'))?.name).toBe('Test Routine');
    expect(await repo.getById('missing')).toBeUndefined();
  });

  it('updates header fields without touching exercises', async () => {
    await repo.create(makeRoutine());
    await repo.update('r1', {
      name: 'Renamed',
      description: undefined,
      category: 'Push',
      updatedAt: '2026-02-02T00:00:00.000Z',
    });
    const routine = await repo.getById('r1');
    expect(routine?.name).toBe('Renamed');
    expect(routine?.category).toBe('Push');
    expect(routine?.description).toBeUndefined();
    expect(routine?.exercises).toHaveLength(2);
  });

  it('deletes a routine and cascades its exercises', async () => {
    await repo.create(makeRoutine());
    await repo.delete('r1');
    expect(await repo.getAll()).toHaveLength(0);

    const recreated = await repo.getById('r1');
    expect(recreated).toBeUndefined();
  });

  it('adds and removes exercises', async () => {
    await repo.create(makeRoutine({ exercises: [] }));
    await repo.setExercises(
      'r1',
      [
        {
          entryId: 'e1',
          exerciseId: 'ex-plank',
          sets: 3,
          reps: 1,
          durationSeconds: 45,
          restSeconds: 40,
        },
      ],
      '2026-03-01T00:00:00.000Z'
    );
    let routine = await repo.getById('r1');
    expect(routine?.exercises).toHaveLength(1);
    expect(routine?.exercises[0].exerciseId).toBe('ex-plank');
    expect(routine?.exercises[0].durationSeconds).toBe(45);

    await repo.setExercises('r1', [], '2026-03-02T00:00:00.000Z');
    routine = await repo.getById('r1');
    expect(routine?.exercises).toHaveLength(0);
  });

  it('preserves exercise ordering across reorders', async () => {
    const exercises: RoutineExercise[] = [
      { entryId: 'a', exerciseId: 'ex-squat', sets: 3, reps: 15, restSeconds: 60 },
      { entryId: 'b', exerciseId: 'ex-pushup', sets: 3, reps: 12, restSeconds: 60 },
      {
        entryId: 'c',
        exerciseId: 'ex-plank',
        sets: 3,
        reps: 1,
        durationSeconds: 45,
        restSeconds: 40,
      },
    ];
    await repo.create(makeRoutine({ exercises }));

    const reordered = [exercises[2], exercises[0], exercises[1]];
    await repo.setExercises('r1', reordered, '2026-04-01T00:00:00.000Z');

    const routine = await repo.getById('r1');
    expect(routine?.exercises.map((e) => e.entryId)).toEqual(['c', 'a', 'b']);
  });

  it('updates an exercise configuration', async () => {
    await repo.create(makeRoutine());
    const updated: RoutineExercise[] = [
      { entryId: 'e1', exerciseId: 'ex-squat', sets: 5, reps: 20, weightKg: 10, restSeconds: 90 },
      { entryId: 'e2', exerciseId: 'ex-pushup', sets: 3, reps: 12, restSeconds: 60 },
    ];
    await repo.setExercises('r1', updated, '2026-05-01T00:00:00.000Z');
    const routine = await repo.getById('r1');
    expect(routine?.exercises[0].sets).toBe(5);
    expect(routine?.exercises[0].reps).toBe(20);
    expect(routine?.exercises[0].weightKg).toBe(10);
    expect(routine?.exercises[0].restSeconds).toBe(90);
  });
});
