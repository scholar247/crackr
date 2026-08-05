import { pgTable, pgEnum, uuid, text, timestamp, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './identity';
import { contentTypeEnum } from './content';

// Cohort a user belongs to (Class 10, Graduation, Hiring Candidate, an org's audience,
// ...) — this is how "AUDIENCE_RESTRICTED" content resolves to who can actually see it.
export const audienceStatusEnum = pgEnum('audience_status', ['ACTIVE', 'ARCHIVED']);

export const audiences = pgTable(
  'audiences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    status: audienceStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('audiences_code_idx').on(table.code)],
);

export const userAudienceMap = pgTable(
  'user_audience_map',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    audienceId: uuid('audience_id')
      .notNull()
      .references(() => audiences.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.audienceId] })],
);

// Optional direct restriction — only consulted when a content row's visibility is
// AUDIENCE_RESTRICTED; PUBLIC/PRIVATE content never needs this table.
export const contentAudienceMap = pgTable(
  'content_audience_map',
  {
    contentType: contentTypeEnum('content_type').notNull(),
    contentId: uuid('content_id').notNull(),
    audienceId: uuid('audience_id')
      .notNull()
      .references(() => audiences.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.contentType, table.contentId, table.audienceId] })],
);
