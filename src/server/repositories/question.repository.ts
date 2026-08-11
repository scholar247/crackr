import { randomUUID } from 'crypto';
import { and, desc, eq, inArray, like } from 'drizzle-orm';
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
    primaryNode: nodeRows.find((n) => n.relationType === 'PRIMARY') ?? null,
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

  if (filters.examId) {
    const rows = await db
      .selectDistinct({ question: questions, authorName: users.name })
      .from(questions)
      .innerJoin(contentExamMap, and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.contentId, questions.id)))
      .leftJoin(users, eq(questions.authorId, users.id))
      .where(and(eq(contentExamMap.examId, filters.examId), ...conditions))
      .orderBy(desc(questions.createdAt))
      .limit(limit);
    return rows.map((r) => ({ ...r.question, authorName: r.authorName }));
  }

  const rows = await db
    .select({ question: questions, authorName: users.name })
    .from(questions)
    .leftJoin(users, eq(questions.authorId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(questions.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.question, authorName: r.authorName }));
}

export interface ListPublishedFilters {
  examId?: string;
  nodeId?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}

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

  return db.select().from(questions).where(and(...conditions)).orderBy(desc(questions.createdAt)).limit(200);
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

export const questionRepository = {
  create,
  update,
  findById,
  list,
  listPublished,
  setPublishStatus,
  setStatusMany,
};
