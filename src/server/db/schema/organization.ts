import { pgTable, pgEnum, uuid, text, timestamp, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './identity';

// Schema-only for this phase — no API/UI built against it yet. This is the hook for
// organizations to onboard their own audiences and private test series later.
export const orgRoleEnum = pgEnum('org_role', ['ORG_ADMIN', 'ORG_MEMBER']);
export const orgStatusEnum = pgEnum('org_status', ['ACTIVE', 'SUSPENDED']);

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    status: orgStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('organizations_slug_idx').on(table.slug)],
);

// Membership is a mapping table, not a hardcoded org_id on `users` — same many-to-many
// principle the ERD applies everywhere else, and lets a user belong to more than one org.
export const orgMemberships = pgTable(
  'org_memberships',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    orgRole: orgRoleEnum('org_role').notNull().default('ORG_MEMBER'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.orgId] })],
);
