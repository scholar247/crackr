import { pgTable, pgEnum, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']);
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'DISABLED']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name'),
    image: text('image'),
    role: userRoleEnum('role').notNull().default('STUDENT'),
    status: userStatusEnum('status').notNull().default('ACTIVE'),
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)],
);

// Deliberately NOT next-auth's own DB adapter (no managed sessions/verification_tokens
// tables) — the app stays on the JWT session strategy. This is our own bookkeeping table
// so signIn/jwt callbacks can resolve "this Google account" -> "this app user" without
// trusting email as identity (mirrors the pre-revamp Mongo authIdentities collection).
export const authAccounts = pgTable(
  'auth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('auth_accounts_provider_idx').on(table.provider, table.providerAccountId)],
);
