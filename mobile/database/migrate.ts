import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from './migrations/migrations';
import { db as defaultDb, type Database } from './client';

export async function runMigrations(db: Database = defaultDb): Promise<void> {
  await migrate(db, migrations);
}
