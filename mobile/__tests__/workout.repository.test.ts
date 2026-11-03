import { WorkoutRepository } from '@/repositories/workout.repository';
import type { ActiveWorkout } from '@/types/workout';

import { createTestDatabase, type TestDatabase } from './helpers/test-db';

function makeActiveWorkout(overrides: Partial<ActiveWorkout> = {}): ActiveWorkout {
  return {
    id: 'session-123',
    routineId: 'r1',
    routineName: 'Full Body Workout',
    exercises: [
      {
        entryId: 'e1',
        exerciseId: 'ex-squat',
        name: 'Bodyweight Squat',
        muscleGroup: 'Legs',
        secondaryMuscles: ['Glutes'],
        equipment: 'Bodyweight',
        accentColor: '#BFF800',
        isHold: false,
        restSeconds: 60,
        sets: [
          { targetReps: 15, completed: true, actualReps: 15 },
          { targetReps: 15, completed: false },
        ],
        skipped: false,
      },
    ],
    currentExerciseIndex: 0,
    currentSetIndex: 1,
    status: 'active',
    runStartedAt: 1_000_000,
    accumulatedActiveMs: 5000,
    startedAt: 999_000,
    finishedAt: null,
    rest: null,
    ...overrides,
  };
}

describe('WorkoutRepository (real SQLite via better-sqlite3)', () => {
  let db: TestDatabase;
  let repo: WorkoutRepository;

  beforeEach(() => {
    ({ db } = createTestDatabase());
    repo = new WorkoutRepository(db);
  });

  it('returns null when no session is saved', async () => {
    expect(await repo.getActiveSession()).toBeNull();
  });

  it('saves and recovers an active session preserving timer fields', async () => {
    const workout = makeActiveWorkout();
    await repo.saveActiveSession(workout, '2026-01-01T00:00:00.000Z');

    const recovered = await repo.getActiveSession();
    expect(recovered).not.toBeNull();
    expect(recovered?.id).toBe('session-123');

    expect(recovered?.runStartedAt).toBe(1_000_000);
    expect(recovered?.accumulatedActiveMs).toBe(5000);
    expect(recovered?.currentSetIndex).toBe(1);
    expect(recovered?.exercises[0].sets[0].completed).toBe(true);
  });

  it('overwrites the single active session on repeated saves', async () => {
    await repo.saveActiveSession(makeActiveWorkout({ currentSetIndex: 0 }));
    await repo.updateActiveSession(makeActiveWorkout({ currentSetIndex: 1, status: 'resting' }));

    const recovered = await repo.getActiveSession();
    expect(recovered?.currentSetIndex).toBe(1);
    expect(recovered?.status).toBe('resting');
  });

  it('deletes the saved session', async () => {
    await repo.saveActiveSession(makeActiveWorkout());
    await repo.deleteActiveSession();
    expect(await repo.getActiveSession()).toBeNull();
  });
});
