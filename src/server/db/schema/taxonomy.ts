import { mysqlTable, mysqlEnum, varchar, text, int, timestamp, primaryKey, uniqueIndex } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';

export const programs = mysqlTable(
  'programs',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    description: text('description'),
    // Not surfaced in any UI yet — reserved for whichever surface needs a program
    // thumbnail first (e.g. program-browse cards), same URL-only pattern as
    // communities.bannerImage / assessments.bannerImage.
    thumbnailUrl: varchar('thumbnail_url', { length: 2048 }),
    status: mysqlEnum('status', ['ACTIVE', 'ARCHIVED']).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('programs_slug_idx').on(table.slug)],
);

export const exams = mysqlTable(
  'exams',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    programId: varchar('program_id', { length: 36 })
      .notNull()
      .references(() => programs.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    description: text('description'),
    // Not surfaced in any UI yet — reserved for whichever surface needs an exam
    // thumbnail first, same URL-only pattern as communities.bannerImage / assessments.bannerImage.
    thumbnailUrl: varchar('thumbnail_url', { length: 2048 }),
    status: mysqlEnum('status', ['ACTIVE', 'ARCHIVED']).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('exams_slug_idx').on(table.slug)],
);

// Generic node for Subject/Chapter/Topic/Subtopic — reusable across exams (per the ERD's
// core insight: one "Mathematics" row, mapped to many exams via exam_node_map).
export const curriculumNodes = mysqlTable('curriculum_nodes', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  nodeType: mysqlEnum('node_type', ['SUBJECT', 'CHAPTER', 'TOPIC', 'SUBTOPIC']).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull(),
  description: text('description'),
  // Not surfaced in any UI yet — reserved for whichever surface needs a subject/chapter
  // thumbnail first, same URL-only pattern as communities.bannerImage / assessments.bannerImage.
  thumbnailUrl: varchar('thumbnail_url', { length: 2048 }),
  status: mysqlEnum('status', ['ACTIVE', 'ARCHIVED']).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Parent-child hierarchy — walked with a recursive CTE (see src/server/repositories),
// not a materialized path, per the ERD's "consider a closure table later if slow" note.
export const curriculumEdges = mysqlTable(
  'curriculum_edges',
  {
    parentNodeId: varchar('parent_node_id', { length: 36 })
      .notNull()
      .references(() => curriculumNodes.id, { onDelete: 'cascade' }),
    childNodeId: varchar('child_node_id', { length: 36 })
      .notNull()
      .references(() => curriculumNodes.id, { onDelete: 'cascade' }),
    sortOrder: int('sort_order').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.parentNodeId, table.childNodeId] })],
);

// Which curriculum nodes are syllabus for which exam — the many-to-many that lets the
// same node (e.g. "Algebra") be shared between JEE Advanced and NIMCET.
export const examNodeMap = mysqlTable(
  'exam_node_map',
  {
    examId: varchar('exam_id', { length: 36 })
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    nodeId: varchar('node_id', { length: 36 })
      .notNull()
      .references(() => curriculumNodes.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.examId, table.nodeId] })],
);
