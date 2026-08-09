import { mysqlTable, mysqlEnum, varchar, bigint, timestamp, primaryKey, uniqueIndex } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { users } from './identity';
import { CONTENT_TYPES } from './content';

// Cohort a user belongs to (Class 10, Graduation, Hiring Candidate, an org's audience,
// ...) — this is how "AUDIENCE_RESTRICTED" content resolves to who can actually see it.
export const audiences = mysqlTable(
  'audiences',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: varchar('name', { length: 160 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    status: mysqlEnum('status', ['ACTIVE', 'ARCHIVED']).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('audiences_code_idx').on(table.code)],
);

export const userAudienceMap = mysqlTable(
  'user_audience_map',
  {
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    audienceId: varchar('audience_id', { length: 36 })
      .notNull()
      .references(() => audiences.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.audienceId] })],
);

// Optional direct restriction — only consulted when a content row's visibility is
// AUDIENCE_RESTRICTED; PUBLIC/PRIVATE content never needs this table.
export const contentAudienceMap = mysqlTable(
  'content_audience_map',
  {
    contentType: mysqlEnum('content_type', CONTENT_TYPES).notNull(),
    contentId: bigint('content_id', { mode: 'number', unsigned: true }).notNull(),
    audienceId: varchar('audience_id', { length: 36 })
      .notNull()
      .references(() => audiences.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.contentType, table.contentId, table.audienceId] })],
);
