import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import * as schema from '@/database/schema';

export type TestDatabase = BetterSQLite3Database<typeof schema>;

const MIGRATION_FILES = [
  join(
  __dirname,
  '..',
  '..',
  'database',
  'migrations',
  '0000_damp_mulholland_black.sql'
  ),
  join(
    __dirname,
    '..',
    '..',
    'database',
    'migrations',
    '0001_account_sync_metadata.sql'
  ),
];

export function createTestDatabase(): { db: TestDatabase; sqlite: Database.Database } {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  for (const migrationFile of MIGRATION_FILES) {
    const migrationSql = readFileSync(migrationFile, 'utf-8');
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      sqlite.exec(statement);
    }
  }

  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}
