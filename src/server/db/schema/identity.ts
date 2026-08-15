import { mysqlTable, mysqlEnum, varchar, int, timestamp, uniqueIndex } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { USER_ROLES } from '@/lib/roles';
import { PREP_LEVELS } from '@/lib/prep-level';
import { programs } from './taxonomy';

export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    email: varchar('email', { length: 320 }).notNull(),
    name: varchar('name', { length: 255 }),
    image: varchar('image', { length: 2048 }),
    role: mysqlEnum('role', USER_ROLES).notNull().default('STUDENT'),
    status: mysqlEnum('status', ['ACTIVE', 'DISABLED']).notNull().default('ACTIVE'),
    onboardingCompletedAt: timestamp('onboarding_completed_at'),
    // Set during onboarding alongside user_exam_targets (see preparation.ts) — the
    // year/level are single attributes of the learner, not per-exam.
    targetYear: int('target_year'),
    level: mysqlEnum('level', PREP_LEVELS),
    // Self-service profile fields (settings page) — all optional, filled in after signup.
    college: varchar('college', { length: 255 }),
    degree: varchar('degree', { length: 255 }),
    passingYear: int('passing_year'),
    targetProgramId: varchar('target_program_id', { length: 36 }).references(() => programs.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)],
);

// Deliberately NOT next-auth's own DB adapter (no managed sessions/verification_tokens
// tables) — the app stays on the JWT session strategy. This is our own bookkeeping table
// so signIn/jwt callbacks can resolve "this Google account" -> "this app user" without
// trusting email as identity (mirrors the pre-revamp Mongo authIdentities collection).
export const authAccounts = mysqlTable(
  'auth_accounts',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('auth_accounts_provider_idx').on(table.provider, table.providerAccountId)],
);
