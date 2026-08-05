import { mysqlTable, mysqlEnum, varchar, timestamp, primaryKey, uniqueIndex } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { users } from './identity';

// Schema-only for this phase — no API/UI built against it yet. This is the hook for
// organizations to onboard their own audiences and private test series later.
export const organizations = mysqlTable(
  'organizations',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    status: mysqlEnum('status', ['ACTIVE', 'SUSPENDED']).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('organizations_slug_idx').on(table.slug)],
);

// Membership is a mapping table, not a hardcoded org_id on `users` — same many-to-many
// principle the ERD applies everywhere else, and lets a user belong to more than one org.
export const orgMemberships = mysqlTable(
  'org_memberships',
  {
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgId: varchar('org_id', { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    orgRole: mysqlEnum('org_role', ['ORG_ADMIN', 'ORG_MEMBER']).notNull().default('ORG_MEMBER'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.orgId] })],
);
