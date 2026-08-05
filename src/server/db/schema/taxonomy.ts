import { pgTable, pgEnum, uuid, text, integer, timestamp, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';

export const curriculumNodeTypeEnum = pgEnum('curriculum_node_type', [
  'SUBJECT',
  'CHAPTER',
  'TOPIC',
  'SUBTOPIC',
]);
export const taxonomyStatusEnum = pgEnum('taxonomy_status', ['ACTIVE', 'ARCHIVED']);

export const programs = pgTable(
  'programs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    status: taxonomyStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('programs_slug_idx').on(table.slug)],
);

export const exams = pgTable(
  'exams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    status: taxonomyStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('exams_slug_idx').on(table.slug)],
);

// Generic node for Subject/Chapter/Topic/Subtopic — reusable across exams (per the ERD's
// core insight: one "Mathematics" row, mapped to many exams via exam_node_map).
export const curriculumNodes = pgTable('curriculum_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  nodeType: curriculumNodeTypeEnum('node_type').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  status: taxonomyStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Parent-child hierarchy — walked with a recursive CTE (see src/server/repositories),
// not a materialized path, per the ERD's "consider a closure table later if slow" note.
export const curriculumEdges = pgTable(
  'curriculum_edges',
  {
    parentNodeId: uuid('parent_node_id')
      .notNull()
      .references(() => curriculumNodes.id, { onDelete: 'cascade' }),
    childNodeId: uuid('child_node_id')
      .notNull()
      .references(() => curriculumNodes.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.parentNodeId, table.childNodeId] })],
);

// Which curriculum nodes are syllabus for which exam — the many-to-many that lets the
// same node (e.g. "Algebra") be shared between JEE Advanced and NIMCET.
export const examNodeMap = pgTable(
  'exam_node_map',
  {
    examId: uuid('exam_id')
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => curriculumNodes.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.examId, table.nodeId] })],
);
