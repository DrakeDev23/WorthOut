import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

export type DrizzleDatabase = BaseSQLiteDatabase<'sync', unknown, typeof schema>;
