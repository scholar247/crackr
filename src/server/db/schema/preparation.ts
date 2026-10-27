import { mysqlTable, varchar, boolean, timestamp, primaryKey } from 'drizzle-orm/mysql-core';
import { users } from './identity';
import { exams } from './taxonomy';

// Which exams a user is preparing for, set during onboarding and editable later.
// Exactly one row per user should have isPrimary=true — MySQL has no partial-unique-index
// to enforce "at most one true per userId" in the schema itself, so this invariant is
// enforced at the repository layer (replace-all-on-write, see user.repository.ts).
export const userExamTargets = mysqlTable(
  'user_exam_targets',
  {
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    examId: varchar('exam_id', { length: 36 })
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.examId] })],
);
