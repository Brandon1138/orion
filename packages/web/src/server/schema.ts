import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
	// Stable id used by the client
	sessionId: text('session_id').primaryKey(),
	userId: text('user_id').notNull(),
	state: text('state').notNull(),
	pattern: text('pattern').notNull(),
	startTime: text('start_time').notNull(),
});

export const messages = sqliteTable('messages', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	sessionId: text('session_id').notNull(),
	role: text('role').notNull(),
	content: text('content').notNull(),
	timestamp: text('timestamp').notNull(),
});

export type DbSession = typeof sessions.$inferSelect;
export type NewDbSession = typeof sessions.$inferInsert;
export type DbMessage = typeof messages.$inferSelect;
export type NewDbMessage = typeof messages.$inferInsert;






