import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const localAccounts = sqliteTable('local_accounts', {
  id: text('id').primaryKey(),
  clerkUserId: text('clerk_user_id').unique(),
  displayName: text('display_name'),
  email: text('email'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type LocalAccountRow = typeof localAccounts.$inferSelect;
export type LocalAccountInsert = typeof localAccounts.$inferInsert;
