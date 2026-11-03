import { runMigrations } from './migrate';
import { seedDefaultRoutinesIfEmpty } from './seed';
import { db, type Database } from './client';

export { db, type Database, DATABASE_NAME, sqliteDatabase } from './client';
export { schema } from './client';
export { runMigrations } from './migrate';
export { seedDefaultRoutinesIfEmpty } from './seed';

export async function initializeDatabase(database: Database = db): Promise<void> {
  await runMigrations(database);
  await seedDefaultRoutinesIfEmpty(database);
}
