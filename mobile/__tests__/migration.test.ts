import { sql } from 'drizzle-orm';

import { createTestDatabase, type TestDatabase } from './helpers/test-db';

describe('migration execution (real SQLite via better-sqlite3)', () => {
  let db: TestDatabase;
  let sqlite: ReturnType<typeof createTestDatabase>['sqlite'];

  beforeEach(() => {
    ({ db, sqlite } = createTestDatabase());
  });

  it('creates all expected tables', () => {
    const rows = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = rows.map((r) => r.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'routines',
        'routine_exercises',
        'workout_history',
        'workout_history_exercises',
        'workout_history_sets',
        'active_session',
      ])
    );
  });

  it('creates the ordering/lookup indexes', () => {
    const rows = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as {
      name: string;
    }[];
    const names = rows.map((r) => r.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'routine_exercises_routine_position_idx',
        'workout_history_date_idx',
        'workout_history_exercises_session_position_idx',
        'workout_history_sets_exercise_position_idx',
      ])
    );
  });

  it('enforces ON DELETE CASCADE within a routine aggregate', async () => {
    sqlite.exec(
      "INSERT INTO routines (id, name, created_at, updated_at) VALUES ('r1','R','t','t')"
    );
    sqlite.exec(
      "INSERT INTO routine_exercises (id, routine_id, exercise_id, position, sets, reps, rest_seconds) VALUES ('e1','r1','ex-squat',0,3,15,60)"
    );
    sqlite.exec("DELETE FROM routines WHERE id='r1'");
    const remaining = await db.get<{ c: number }>(sql`SELECT COUNT(*) as c FROM routine_exercises`);
    expect(remaining?.c).toBe(0);
  });
});
