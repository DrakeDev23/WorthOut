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

  it('creates a legacy account and sync metadata defaults', () => {
    sqlite.exec(
      "INSERT INTO routines (id, name, created_at, updated_at) VALUES ('legacy-routine','Legacy','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z')"
    );
    const row = sqlite
      .prepare('SELECT account_id, sync_status, client_updated_at, server_version, deleted_at FROM routines WHERE id = ?')
      .get('legacy-routine') as {
      account_id: string;
      sync_status: string;
      client_updated_at: string;
      server_version: number;
      deleted_at: string | null;
    };
    expect(row.account_id).toBe('00000000-0000-4000-8000-000000000001');
    expect(row.sync_status).toBe('synced');
    expect(row.client_updated_at).toBe('');
    expect(row.server_version).toBe(0);
    expect(row.deleted_at).toBeNull();
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM local_accounts WHERE id = ?').get('00000000-0000-4000-8000-000000000001')
    ).toEqual({ count: 1 });
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
