import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'worthout.db';

export const sqliteDatabase = openDatabaseSync(DATABASE_NAME);

sqliteDatabase.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqliteDatabase, { schema });

export type Database = typeof db;
export { schema };
