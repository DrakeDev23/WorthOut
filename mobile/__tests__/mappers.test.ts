import {
  toRoutine,
  toRoutineExercise,
  toRoutineExerciseRow,
  toWorkoutSession,
} from '@/database/mappers';
import type {
  RoutineExerciseRow,
  RoutineRow,
  WorkoutHistoryExerciseRow,
  WorkoutHistoryRow,
  WorkoutHistorySetRow,
} from '@/database/schema';

describe('database mappers (pure, no SQLite)', () => {
  const syncFields = {
    accountId: '00000000-0000-4000-8000-000000000001',
    syncStatus: 'synced',
    clientUpdatedAt: '2026-01-01T00:00:00.000Z',
    lastSyncedAt: null,
    serverVersion: 0,
    serverUpdatedAt: null,
    deletedAt: null,
  };

  it('maps a routine-exercise row, converting nulls to undefined', () => {
    const row: RoutineExerciseRow = {
      ...syncFields,
      id: 'e1',
      routineId: 'r1',
      exerciseId: 'ex-squat',
      position: 0,
      sets: 3,
      reps: 15,
      durationSeconds: null,
      weightKg: null,
      restSeconds: 60,
    };
    const entry = toRoutineExercise(row);
    expect(entry).toEqual({
      entryId: 'e1',
      exerciseId: 'ex-squat',
      sets: 3,
      reps: 15,
      durationSeconds: undefined,
      weightKg: undefined,
      restSeconds: 60,
    });
  });

  it('assembles a routine and recomputes derived fields from exercise order', () => {
    const row: RoutineRow = {
      ...syncFields,
      id: 'r1',
      name: 'Legs',
      description: null,
      category: 'Lower Body',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    const exerciseRows: RoutineExerciseRow[] = [
      {
        ...syncFields,
        id: 'b',
        routineId: 'r1',
        exerciseId: 'ex-pushup',
        position: 1,
        sets: 3,
        reps: 12,
        durationSeconds: null,
        weightKg: null,
        restSeconds: 60,
      },
      {
        ...syncFields,
        id: 'a',
        routineId: 'r1',
        exerciseId: 'ex-squat',
        position: 0,
        sets: 3,
        reps: 15,
        durationSeconds: null,
        weightKg: null,
        restSeconds: 60,
      },
    ];
    const routine = toRoutine(row, exerciseRows);

    expect(routine.exercises.map((e) => e.entryId)).toEqual(['a', 'b']);
    expect(routine.description).toBeUndefined();
    expect(routine.estimatedMinutes).toBeGreaterThan(0);

    expect(routine.focus).toBeDefined();
  });

  it('round-trips a routine exercise through row conversion', () => {
    const entry = {
      entryId: 'e1',
      exerciseId: 'ex-plank',
      sets: 3,
      reps: 1,
      durationSeconds: 45,
      restSeconds: 40,
    };
    const row = toRoutineExerciseRow('r1', entry, 2);
    expect(row.position).toBe(2);
    expect(row.routineId).toBe('r1');
    expect(toRoutineExercise(row)).toEqual(entry);
  });

  it('reassembles a workout session from header, exercises and sets', () => {
    const header: WorkoutHistoryRow = {
      ...syncFields,
      id: 's1',
      routineId: 'r1',
      routineNameSnapshot: 'Push Day',
      date: '2026-10-31T07:30:00.000Z',
      durationMinutes: 40,
      totalSets: 3,
    };
    const exerciseRows: WorkoutHistoryExerciseRow[] = [
      { ...syncFields, id: 's1-ex-0', sessionId: 's1', exerciseId: 'ex-pushup', name: 'Push-Up', position: 0 },
    ];
    const setRows: WorkoutHistorySetRow[] = [
      {
        ...syncFields,
        id: 's1-ex-0-set-1',
        exerciseRef: 's1-ex-0',
        position: 1,
        reps: 12,
        weightKg: null,
        durationSeconds: null,
      },
      {
        ...syncFields,
        id: 's1-ex-0-set-0',
        exerciseRef: 's1-ex-0',
        position: 0,
        reps: 15,
        weightKg: null,
        durationSeconds: null,
      },
    ];
    const session = toWorkoutSession(header, exerciseRows, new Map([['s1-ex-0', setRows]]));
    expect(session.routineName).toBe('Push Day');
    expect(session.exercises).toHaveLength(1);

    expect(session.exercises[0].sets.map((s) => s.reps)).toEqual([15, 12]);
  });
});
