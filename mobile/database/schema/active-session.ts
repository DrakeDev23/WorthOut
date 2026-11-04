import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { localAccounts } from './accounts';

export const activeSession = sqliteTable('active_session', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => localAccounts.id),
  payload: text('payload').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const ACTIVE_SESSION_ID = 'current';

export type ActiveSessionRow = typeof activeSession.$inferSelect;
export type ActiveSessionInsert = typeof activeSession.$inferInsert;
