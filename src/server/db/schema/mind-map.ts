import { mysqlTable, mysqlEnum, varchar, text, int, json, timestamp, uniqueIndex, index, type AnyMySqlColumn } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { users } from './identity';
import { curriculumNodes, exams } from './taxonomy';
import { MIND_MAP_STATUSES, MIND_MAP_THEMES, type MindMapFaq, type MindMapNodeStyle, type MindMapSnapshot } from '@/lib/mind-maps';

// Chapter mind maps. The curriculum (curriculum_nodes / edges / exam_node_map) stays the
// single source of truth: a map belongs to an existing CHAPTER node for an exam, and its
// nodes reference existing TOPIC/SUBTOPIC nodes by id. Only editorial extras (descriptions,
// revision notes, custom nodes) live here.
//
// Editing vs. publishing: admins edit the draft (mind_map_nodes + the text columns);
// publishing freezes everything into `published_snapshot`, which is all public pages read.
// So edits to a published map don't go live until they are reviewed and published again.
export const mindMaps = mysqlTable(
  'mind_maps',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    examId: varchar('exam_id', { length: 36 })
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    chapterNodeId: varchar('chapter_node_id', { length: 36 })
      .notNull()
      .references(() => curriculumNodes.id, { onDelete: 'cascade' }),
    status: mysqlEnum('status', MIND_MAP_STATUSES).notNull().default('DRAFT'),
    theme: mysqlEnum('theme', MIND_MAP_THEMES).notNull().default('COLOUR'),
    seoTitle: varchar('seo_title', { length: 200 }),
    seoDescription: varchar('seo_description', { length: 320 }),
    intro: text('intro'),
    /** Markdown — editor-written quick revision (definitions, formulas, key facts). */
    revisionNotes: text('revision_notes'),
    faqs: json('faqs').$type<MindMapFaq[]>(),
    /** What the public page shows; null until first published. */
    publishedSnapshot: json('published_snapshot').$type<MindMapSnapshot>(),
    publishedAt: timestamp('published_at'),
    createdBy: varchar('created_by', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    updatedBy: varchar('updated_by', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // One mind map per chapter per exam.
    uniqueIndex('mind_maps_exam_chapter_idx').on(table.examId, table.chapterNodeId),
    index('mind_maps_exam_status_idx').on(table.examId, table.status),
  ],
);

export const mindMapNodes = mysqlTable(
  'mind_map_nodes',
  {
    // Client-generated UUIDs so the editor keeps stable ids across saves.
    id: varchar('id', { length: 36 }).primaryKey(),
    mindMapId: varchar('mind_map_id', { length: 36 })
      .notNull()
      .references(() => mindMaps.id, { onDelete: 'cascade' }),
    /** Null for a main branch (child of the central chapter node). */
    parentId: varchar('parent_id', { length: 36 }).references((): AnyMySqlColumn => mindMapNodes.id, { onDelete: 'cascade' }),
    /** The existing TOPIC/SUBTOPIC this node represents; null for an editor-added custom node. */
    curriculumNodeId: varchar('curriculum_node_id', { length: 36 }).references(() => curriculumNodes.id, { onDelete: 'set null' }),
    label: varchar('label', { length: 300 }).notNull(),
    labelHi: varchar('label_hi', { length: 300 }),
    style: json('style').$type<MindMapNodeStyle>(),
    tags: json('tags').$type<string[]>(),
    description: varchar('description', { length: 500 }),
    /** Markdown — optional extra learning content (definitions, formulas) for this node. */
    content: text('content'),
    displayOrder: int('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('mind_map_nodes_map_parent_idx').on(table.mindMapId, table.parentId, table.displayOrder)],
);

/**
 * Every published version of a map (the snapshot as it went live), newest = highest
 * `version`. Lets editors see what changed over time and restore an older version into the
 * draft. Rows are only ever inserted.
 */
export const mindMapVersions = mysqlTable(
  'mind_map_versions',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    mindMapId: varchar('mind_map_id', { length: 36 })
      .notNull()
      .references(() => mindMaps.id, { onDelete: 'cascade' }),
    version: int('version').notNull(),
    snapshot: json('snapshot').$type<MindMapSnapshot>().notNull(),
    /** Null for versions back-filled from before history was kept. */
    nodeCount: int('node_count'),
    publishedBy: varchar('published_by', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at').notNull(),
  },
  (table) => [uniqueIndex('mind_map_versions_map_version_idx').on(table.mindMapId, table.version)],
);
