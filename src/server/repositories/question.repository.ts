import { randomUUID } from 'crypto';
import { and, asc, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { questions, contentNodeMap, contentExamMap, curriculumNodes, exams, users } from '@/server/db/schema';
import type { QuestionOption } from '@/server/db/schema/content';
import { CONTENT_STATUSES } from '@/server/db/schema/content';
import { taxonomyRepository } from './taxonomy.repository';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface QuestionInput {
  stem: string;
  options: QuestionOption[];
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  tags?: string[];
  nodeId?: string;
  examIds: string[];
}

export interface ListQuestionsFilters {
  examId?: string;
  status?: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  search?: string;
  limit?: number;
  page?: number;
}

/**
 * Replaces this question's node tags wholesale: one PRIMARY row for the exact node
 * chosen, plus a SUPPLEMENTARY row for every ancestor (Chapter, Subject, ...) — so a
 * question tagged at "Quadratic Equations" (Topic) is automatically findable under
 * "Algebra" (Chapter) and "Mathematics" (Subject) too, without a recursive query at
 * read time. Passing no nodeId just clears any existing tag.
 */
async function setNodeTag(tx: Tx, questionId: number, nodeId: string | undefined) {
  await tx.delete(contentNodeMap).where(and(eq(contentNodeMap.contentType, 'QUESTION'), eq(contentNodeMap.contentId, questionId)));
  if (!nodeId) return;

  const ancestorIds = await taxonomyRepository.getAncestorIds(nodeId);
  await tx.insert(contentNodeMap).values({
    id: randomUUID(),
    contentType: 'QUESTION',
    contentId: questionId,
    nodeId,
    relationType: 'PRIMARY',
  });
  if (ancestorIds.size > 0) {
    await tx.insert(contentNodeMap).values(
      Array.from(ancestorIds).map((id) => ({
        id: randomUUID(),
        contentType: 'QUESTION' as const,
        contentId: questionId,
        nodeId: id,
        relationType: 'SUPPLEMENTARY' as const,
      }))
    );
  }
}

/**
 * Like setNodeTag, but for tagging a question to *multiple* explicit nodes at once
 * (e.g. a question equally relevant to "Probability" and "Permutations", not an
 * ancestor-descendant pair) — the single-node admin form still only ever calls
 * setNodeTag; this is purpose-built for bulkCreate, where callers hand over a whole
 * list of nodes per question. Every given node is PRIMARY; every distinct ancestor
 * across all of them is SUPPLEMENTARY, minus whatever's already explicitly listed.
 */
async function setNodeTags(tx: Tx, questionId: number, nodeIds: string[]) {
  await tx.delete(contentNodeMap).where(and(eq(contentNodeMap.contentType, 'QUESTION'), eq(contentNodeMap.contentId, questionId)));
  if (nodeIds.length === 0) return;

  const explicitIds = new Set(nodeIds);
  const ancestorIds = new Set<string>();
  for (const nodeId of nodeIds) {
    const ancestors = await taxonomyRepository.getAncestorIds(nodeId);
    ancestors.forEach((id) => ancestorIds.add(id));
  }
  explicitIds.forEach((id) => ancestorIds.delete(id));

  await tx.insert(contentNodeMap).values([
    ...nodeIds.map((nodeId) => ({
      id: randomUUID(),
      contentType: 'QUESTION' as const,
      contentId: questionId,
      nodeId,
      relationType: 'PRIMARY' as const,
    })),
    ...Array.from(ancestorIds).map((nodeId) => ({
      id: randomUUID(),
      contentType: 'QUESTION' as const,
      contentId: questionId,
      nodeId,
      relationType: 'SUPPLEMENTARY' as const,
    })),
  ]);
}

async function setExamTags(tx: Tx, questionId: number, examIds: string[]) {
  await tx.delete(contentExamMap).where(and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.contentId, questionId)));
  if (examIds.length === 0) return;
  await tx.insert(contentExamMap).values(
    examIds.map((examId) => ({
      id: randomUUID(),
      contentType: 'QUESTION' as const,
      contentId: questionId,
      examId,
      relationType: 'PRIMARY' as const,
    }))
  );
}

async function create(input: QuestionInput, authorId: string | null) {
  let id = 0;
  await db.transaction(async (tx) => {
    const [result] = await tx.insert(questions).values({
      stem: input.stem,
      optionsJson: input.options,
      explanation: input.explanation,
      difficulty: input.difficulty,
      tags: input.tags,
      // status stays DRAFT (schema default) until explicitly published; visibility is
      // set PUBLIC up front so status is the only gate the admin UI needs to think about.
      visibility: 'PUBLIC',
      authorId: authorId ?? undefined,
    });
    id = result.insertId;
    await setNodeTag(tx, id, input.nodeId);
    await setExamTags(tx, id, input.examIds);
  });
  return findById(id);
}

export interface BulkQuestionInput {
  stem: string;
  options: QuestionOption[];
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  tags?: string[];
  // Plural, unlike QuestionInput.nodeId — bulk callers can map one question to several
  // explicit nodes directly, not just one deepest node with inferred ancestors.
  nodeIds?: string[];
  examIds: string[];
  status?: (typeof CONTENT_STATUSES)[number];
}

// Sequential, not Promise.all — mirrors the blog bulk-create route's reasoning: each
// insert is its own transaction, and running many transactions concurrently against the
// same connection pool has no benefit here while making failures harder to reason about.
async function bulkCreate(inputs: BulkQuestionInput[], authorId: string | null) {
  const created = [];
  for (const input of inputs) {
    let id = 0;
    await db.transaction(async (tx) => {
      const [result] = await tx.insert(questions).values({
        stem: input.stem,
        optionsJson: input.options,
        explanation: input.explanation,
        difficulty: input.difficulty,
        tags: input.tags,
        status: input.status ?? 'DRAFT',
        visibility: 'PUBLIC',
        authorId: authorId ?? undefined,
      });
      id = result.insertId;
      await setNodeTags(tx, id, input.nodeIds ?? []);
      await setExamTags(tx, id, input.examIds);
    });
    created.push(await findById(id));
  }
  return created;
}

async function update(id: number, input: Partial<QuestionInput>, editorId: string | null = null) {
  await db.transaction(async (tx) => {
    const patch: Partial<typeof questions.$inferInsert> = { updatedAt: new Date(), updatedBy: editorId ?? undefined };
    if (input.stem !== undefined) patch.stem = input.stem;
    if (input.options !== undefined) patch.optionsJson = input.options;
    if (input.explanation !== undefined) patch.explanation = input.explanation;
    if (input.difficulty !== undefined) patch.difficulty = input.difficulty;
    if (input.tags !== undefined) patch.tags = input.tags;
    await tx.update(questions).set(patch).where(eq(questions.id, id));

    if (input.nodeId !== undefined) await setNodeTag(tx, id, input.nodeId);
    if (input.examIds !== undefined) await setExamTags(tx, id, input.examIds);
  });
  return findById(id);
}

async function findById(id: number) {
  const [row] = await db
    .select({ question: questions, author: { name: users.name, image: users.image } })
    .from(questions)
    .leftJoin(users, eq(questions.authorId, users.id))
    .where(eq(questions.id, id))
    .limit(1);
  if (!row) return null;
  const { question, author } = row;

  const nodeRows = await db
    .select({
      nodeId: contentNodeMap.nodeId,
      relationType: contentNodeMap.relationType,
      nodeName: curriculumNodes.name,
      nodeType: curriculumNodes.nodeType,
    })
    .from(contentNodeMap)
    .innerJoin(curriculumNodes, eq(contentNodeMap.nodeId, curriculumNodes.id))
    .where(and(eq(contentNodeMap.contentType, 'QUESTION'), eq(contentNodeMap.contentId, id)));

  const examRows = await db
    .select({ examId: contentExamMap.examId, examName: exams.name, examSlug: exams.slug })
    .from(contentExamMap)
    .innerJoin(exams, eq(contentExamMap.examId, exams.id))
    .where(and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.contentId, id)));

  return {
    ...question,
    author,
    // Kept singular for the existing single-node admin edit form (question-form.tsx),
    // which only ever reads the first one. primaryNodes (plural) is the full list —
    // bulkCreate can tag more than one node PRIMARY, which the singular field alone
    // would silently truncate.
    primaryNode: nodeRows.find((n) => n.relationType === 'PRIMARY') ?? null,
    primaryNodes: nodeRows.filter((n) => n.relationType === 'PRIMARY'),
    ancestorNodes: nodeRows.filter((n) => n.relationType === 'SUPPLEMENTARY'),
    exams: examRows,
  };
}

// Scoped to one exam at a time (the "Global Context" pattern) rather than joining both
// exam and node maps — keeps the query shape simple; node-level filtering isn't needed
// for the question-bank list view today.
async function list(filters: ListQuestionsFilters = {}) {
  const conditions = [];
  if (filters.status) conditions.push(eq(questions.status, filters.status));
  if (filters.difficulty) conditions.push(eq(questions.difficulty, filters.difficulty));
  if (filters.search) conditions.push(like(questions.stem, `%${filters.search}%`));
  const limit = filters.limit ?? 100;
  const page = filters.page ?? 1;
  const offset = (page - 1) * limit;

  if (filters.examId) {
    const where = and(eq(contentExamMap.examId, filters.examId), ...conditions);
    const [rows, [{ count }]] = await Promise.all([
      db
        .selectDistinct({ question: questions, authorName: users.name })
        .from(questions)
        .innerJoin(contentExamMap, and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.contentId, questions.id)))
        .leftJoin(users, eq(questions.authorId, users.id))
        .where(where)
        .orderBy(desc(questions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(distinct ${questions.id})` })
        .from(questions)
        .innerJoin(contentExamMap, and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.contentId, questions.id)))
        .where(where),
    ]);
    return { rows: rows.map((r) => ({ ...r.question, authorName: r.authorName })), total: Number(count) };
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const [rows, [{ count }]] = await Promise.all([
    db
      .select({ question: questions, authorName: users.name })
      .from(questions)
      .leftJoin(users, eq(questions.authorId, users.id))
      .where(where)
      .orderBy(desc(questions.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(questions).where(where),
  ]);
  return { rows: rows.map((r) => ({ ...r.question, authorName: r.authorName })), total: Number(count) };
}

export type PublishedSort = 'newest' | 'oldest' | 'difficulty_asc' | 'difficulty_desc';

export interface ListPublishedFilters {
  examId?: string;
  nodeId?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  sort?: PublishedSort;
}

// Difficulty is a MySQL enum in declaration order (EASY, MEDIUM, HARD, EXPERT) — that's
// not the same as severity order, so a plain ORDER BY difficulty sorts alphabetically
// (EASY, EXPERT, HARD, MEDIUM). This case expression maps to actual difficulty rank.
const DIFFICULTY_RANK = sql`case ${questions.difficulty}
  when 'EASY' then 1 when 'MEDIUM' then 2 when 'HARD' then 3 when 'EXPERT' then 4 end`;

/**
 * PUBLISHED + PUBLIC only — the student-facing practice browser's data source. Filtering
 * by nodeId benefits directly from the ancestor propagation in setNodeTag: a question
 * tagged at a Topic is also mapped to its Chapter and Subject, so "give me every question
 * under Mathematics" is this same simple subquery, not a recursive tree walk.
 */
async function listPublished(filters: ListPublishedFilters = {}) {
  const conditions = [eq(questions.status, 'PUBLISHED'), eq(questions.visibility, 'PUBLIC')];
  if (filters.difficulty) conditions.push(eq(questions.difficulty, filters.difficulty));

  if (filters.examId) {
    conditions.push(
      inArray(
        questions.id,
        db
          .select({ id: contentExamMap.contentId })
          .from(contentExamMap)
          .where(and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.examId, filters.examId)))
      )
    );
  }
  if (filters.nodeId) {
    conditions.push(
      inArray(
        questions.id,
        db
          .select({ id: contentNodeMap.contentId })
          .from(contentNodeMap)
          .where(and(eq(contentNodeMap.contentType, 'QUESTION'), eq(contentNodeMap.nodeId, filters.nodeId)))
      )
    );
  }

  const orderBy =
    filters.sort === 'oldest'
      ? asc(questions.createdAt)
      : filters.sort === 'difficulty_asc'
        ? DIFFICULTY_RANK
        : filters.sort === 'difficulty_desc'
          ? sql`${DIFFICULTY_RANK} desc`
          : desc(questions.createdAt);

  return db.select().from(questions).where(and(...conditions)).orderBy(orderBy).limit(200);
}

async function setPublishStatus(id: number, publish: boolean, editorId: string | null = null) {
  await db
    .update(questions)
    .set({ status: publish ? 'PUBLISHED' : 'DRAFT', updatedAt: new Date(), updatedBy: editorId ?? undefined })
    .where(eq(questions.id, id));
  return findById(id);
}

// Admin-only bulk status change from the question bank list view — same status enum as
// setPublishStatus but not limited to the PUBLISHED/DRAFT pair, so an admin can also bulk
// move a selection to IN_REVIEW or ARCHIVED in one action.
async function setStatusMany(ids: number[], status: (typeof CONTENT_STATUSES)[number], editorId: string | null = null) {
  if (ids.length === 0) return [];
  await db
    .update(questions)
    .set({ status, updatedAt: new Date(), updatedBy: editorId ?? undefined })
    .where(inArray(questions.id, ids));
  return db.select().from(questions).where(inArray(questions.id, ids));
}

// Powers the blog detail page's "Concept Check" card — one random published question
// tagged to any of the given node ids (typically an article's full tag set, leaf +
// ancestors, so a question pinned to the parent chapter still counts as a match).
async function findRandomPublishedByNodes(nodeIds: string[]) {
  if (nodeIds.length === 0) return null;
  const rows = await db
    .selectDistinct({ id: questions.id })
    .from(questions)
    .innerJoin(contentNodeMap, and(eq(contentNodeMap.contentType, 'QUESTION'), eq(contentNodeMap.contentId, questions.id)))
    .where(and(eq(questions.status, 'PUBLISHED'), eq(questions.visibility, 'PUBLIC'), inArray(contentNodeMap.nodeId, nodeIds)));
  if (rows.length === 0) return null;
  const chosen = rows[Math.floor(Math.random() * rows.length)];
  return findById(chosen.id);
}

export const questionRepository = {
  create,
  bulkCreate,
  update,
  findById,
  list,
  listPublished,
  setPublishStatus,
  setStatusMany,
  findRandomPublishedByNodes,
};
