import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { assessments, articles, contentExamMap, contentNodeMap, questions, exams } from '@/server/db/schema';
import { taxonomyRepository } from './taxonomy.repository';
import { dailyQuestionRepository } from './daily-question.repository';
import { istDayKey } from '@/lib/ist-date';

// Calendar day in IST — the audience is Indian exam aspirants, so "today's problem"
// should roll over at their midnight, not the server's.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function istDayNumber(now = new Date()) {
  return Math.floor((now.getTime() + IST_OFFSET_MS) / DAY_MS);
}

export function nextIstMidnight(now = new Date()) {
  return new Date((istDayNumber(now) + 1) * DAY_MS - IST_OFFSET_MS);
}

export interface ExamSpotlightStats {
  subjects: number;
  chapters: number;
  mcqs: number;
  pyqs: number;
  /** Chapters that have at least one published practice MCQ — real syllabus coverage. */
  chaptersWithMcqs: number;
  openMocks: number;
  articles: number;
}

export interface DailyProblem {
  id: number;
  stem: string;
  options: { key: string; text: string; isCorrect: boolean }[];
  explanation: string | null;
  difficulty: string;
  nextRefreshAt: string;
}

// Real counts straight from the DB — no illustrative numbers.
async function getStats(examId: string): Promise<ExamSpotlightStats> {
  const [tree, [mcqRow], [pyqRow], [mockRow], [articleRow]] = await Promise.all([
    taxonomyRepository.getSyllabusTree(examId),
    db
      .select({ n: sql<number>`count(distinct ${questions.id})` })
      .from(questions)
      .innerJoin(contentExamMap, and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.contentId, questions.id)))
      .where(and(eq(contentExamMap.examId, examId), eq(questions.status, 'PUBLISHED'), eq(questions.visibility, 'PUBLIC'))),
    // PYQs are questions tagged "pyq" (freeform tags column).
    db
      .select({ n: sql<number>`count(distinct ${questions.id})` })
      .from(questions)
      .innerJoin(contentExamMap, and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.contentId, questions.id)))
      .where(
        and(
          eq(contentExamMap.examId, examId),
          eq(questions.status, 'PUBLISHED'),
          eq(questions.visibility, 'PUBLIC'),
          sql`json_contains(${questions.tags}, '"pyq"')`,
        ),
      ),
    db
      .select({ n: sql<number>`count(*)` })
      .from(assessments)
      .where(
        and(
          eq(assessments.examId, examId),
          eq(assessments.status, 'PUBLISHED'),
          eq(assessments.visibility, 'PUBLIC'),
          inArray(assessments.type, ['OFFICIAL', 'MOCK', 'TEST']),
        ),
      ),
    db
      .select({ n: sql<number>`count(distinct ${articles.id})` })
      .from(articles)
      .innerJoin(contentExamMap, and(eq(contentExamMap.contentType, 'ARTICLE'), eq(contentExamMap.contentId, articles.id)))
      .where(and(eq(contentExamMap.examId, examId), eq(articles.status, 'PUBLISHED'), eq(articles.visibility, 'PUBLIC'))),
  ]);

  const chapterIds = new Set<string>();
  const collectChapters = (nodes: typeof tree) => {
    for (const n of nodes) {
      if (n.nodeType === 'CHAPTER') chapterIds.add(n.id);
      collectChapters(n.children);
    }
  };
  collectChapters(tree);

  let chaptersWithMcqs = 0;
  if (chapterIds.size > 0) {
    const [row] = await db
      .select({ n: sql<number>`count(distinct ${contentNodeMap.nodeId})` })
      .from(contentNodeMap)
      .innerJoin(questions, eq(questions.id, contentNodeMap.contentId))
      .where(
        and(
          eq(contentNodeMap.contentType, 'QUESTION'),
          inArray(contentNodeMap.nodeId, [...chapterIds]),
          eq(questions.status, 'PUBLISHED'),
          eq(questions.visibility, 'PUBLIC'),
        ),
      );
    chaptersWithMcqs = Number(row?.n ?? 0);
  }

  return {
    subjects: tree.length,
    chapters: chapterIds.size,
    chaptersWithMcqs,
    mcqs: Number(mcqRow?.n ?? 0),
    pyqs: Number(pyqRow?.n ?? 0),
    openMocks: Number(mockRow?.n ?? 0),
    articles: Number(articleRow?.n ?? 0),
  };
}

// ── Question of the day ─────────────────────────────────────────────────────────
// One question per exam per IST day. The pick is made once per exam per day (ids sorted,
// indexed by day number, so it rotates through the whole pool) and stored in
// daily_questions; after that every request reads it by primary key. A short per-instance
// memo skips even that read on hot pages, while still picking up admin edits to the
// question within a few minutes.

const PICK_MEMO_TTL_MS = 5 * 60 * 1000;
const pickMemo = new Map<string, { day: number; at: number; problem: DailyProblem | null }>();

/** The O(pool) part — runs at most once per exam per day (plus if a pick is unpublished). */
async function pickFromPool(examId: string, day: number, excludeId?: number | null): Promise<number | null> {
  const rows = await db
    .select({ id: questions.id })
    .from(questions)
    .innerJoin(contentExamMap, and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.contentId, questions.id)))
    .where(and(eq(contentExamMap.examId, examId), eq(questions.status, 'PUBLISHED'), eq(questions.visibility, 'PUBLIC')))
    .groupBy(questions.id)
    .orderBy(questions.id);
  const pool = excludeId ? rows.filter((r) => r.id !== excludeId) : rows;
  return pool.length ? pool[day % pool.length].id : null;
}

async function loadPublishedQuestion(id: number) {
  const [q] = await db
    .select()
    .from(questions)
    .where(and(eq(questions.id, id), eq(questions.status, 'PUBLISHED'), eq(questions.visibility, 'PUBLIC')))
    .limit(1);
  return q ?? null;
}

async function loadDailyProblem(examId: string, day: number): Promise<DailyProblem | null> {
  const dayKey = istDayKey();
  const stored = await dailyQuestionRepository.findPick(examId, dayKey);
  let q = stored ? await loadPublishedQuestion(stored) : null;

  if (!q) {
    // First request of the day — or today's pick was unpublished/deleted since: pick again.
    const chosen = await pickFromPool(examId, day, stored);
    if (!chosen) return null;
    let id = chosen;
    if (stored === undefined) id = await dailyQuestionRepository.savePick(examId, dayKey, chosen);
    else await dailyQuestionRepository.replacePick(examId, dayKey, chosen);
    q = await loadPublishedQuestion(id);
    if (!q) return null;
  }

  return {
    id: q.id,
    stem: q.stem,
    options: q.optionsJson,
    explanation: q.explanation,
    difficulty: q.difficulty,
    nextRefreshAt: nextIstMidnight().toISOString(),
  };
}

async function getDailyProblem(examId: string): Promise<DailyProblem | null> {
  const day = istDayNumber();
  const hit = pickMemo.get(examId);
  if (hit && hit.day === day && Date.now() - hit.at < PICK_MEMO_TTL_MS) return hit.problem;
  const problem = await loadDailyProblem(examId, day);
  pickMemo.set(examId, { day, at: Date.now(), problem });
  return problem;
}

async function getSpotlight(examId: string) {
  const [stats, dailyProblem] = await Promise.all([getStats(examId), getDailyProblem(examId)]);
  return { stats, dailyProblem };
}

// Platform-wide totals for the homepage hero — all real counts, public content only.
async function getPlatformStats() {
  const [[examRow], [mcqRow], [pyqRow], [mockRow], [articleRow]] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)` })
      .from(exams)
      .where(eq(exams.status, 'ACTIVE')),
    db
      .select({ n: sql<number>`count(*)` })
      .from(questions)
      .where(and(eq(questions.status, 'PUBLISHED'), eq(questions.visibility, 'PUBLIC'))),
    db
      .select({ n: sql<number>`count(*)` })
      .from(questions)
      .where(and(eq(questions.status, 'PUBLISHED'), eq(questions.visibility, 'PUBLIC'), sql`json_contains(${questions.tags}, '"pyq"')`)),
    db
      .select({ n: sql<number>`count(*)` })
      .from(assessments)
      .where(
        and(
          eq(assessments.status, 'PUBLISHED'),
          eq(assessments.visibility, 'PUBLIC'),
          inArray(assessments.type, ['OFFICIAL', 'MOCK', 'TEST']),
        ),
      ),
    db
      .select({ n: sql<number>`count(*)` })
      .from(articles)
      .where(and(eq(articles.status, 'PUBLISHED'), eq(articles.visibility, 'PUBLIC'))),
  ]);
  return {
    exams: Number(examRow?.n ?? 0),
    mcqs: Number(mcqRow?.n ?? 0),
    pyqs: Number(pyqRow?.n ?? 0),
    mockTests: Number(mockRow?.n ?? 0),
    articles: Number(articleRow?.n ?? 0),
  };
}

// Stats for every active exam in a program, keyed by exam slug — feeds the exam cards.
async function getProgramStats(programId: string): Promise<Record<string, ExamSpotlightStats>> {
  const rows = await db
    .select({ id: exams.id, slug: exams.slug })
    .from(exams)
    .where(and(eq(exams.programId, programId), eq(exams.status, 'ACTIVE')));
  const entries = await Promise.all(rows.map(async (r) => [r.slug, await getStats(r.id)] as const));
  return Object.fromEntries(entries);
}

export interface ExamSummaryStats {
  chapters: number;
  mcqs: number;
  pyqs: number;
  mockTests: number;
}

// Content counts for EVERY active exam in a fixed number of grouped queries (not a handful
// per exam), for the /exams directory. Keyed by exam id; exams with no content are absent.
async function getAllExamSummaries(): Promise<Record<string, ExamSummaryStats>> {
  const [mcqRows, pyqRows, mockRows, [chapterRows]] = await Promise.all([
    db
      .select({ examId: contentExamMap.examId, n: sql<number>`count(distinct ${questions.id})` })
      .from(questions)
      .innerJoin(contentExamMap, and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.contentId, questions.id)))
      .where(and(eq(questions.status, 'PUBLISHED'), eq(questions.visibility, 'PUBLIC')))
      .groupBy(contentExamMap.examId),
    db
      .select({ examId: contentExamMap.examId, n: sql<number>`count(distinct ${questions.id})` })
      .from(questions)
      .innerJoin(contentExamMap, and(eq(contentExamMap.contentType, 'QUESTION'), eq(contentExamMap.contentId, questions.id)))
      .where(and(eq(questions.status, 'PUBLISHED'), eq(questions.visibility, 'PUBLIC'), sql`json_contains(${questions.tags}, '"pyq"')`))
      .groupBy(contentExamMap.examId),
    db
      .select({ examId: assessments.examId, n: sql<number>`count(*)` })
      .from(assessments)
      .where(
        and(
          eq(assessments.status, 'PUBLISHED'),
          eq(assessments.visibility, 'PUBLIC'),
          inArray(assessments.type, ['OFFICIAL', 'MOCK', 'TEST']),
        ),
      )
      .groupBy(assessments.examId),
    // Chapters reachable from each exam's syllabus roots (same traversal as getSyllabusTree).
    db.execute(sql`
      WITH RECURSIVE reachable AS (
        SELECT exam_id, node_id AS id FROM exam_node_map
        UNION
        SELECT r.exam_id, edge.child_node_id FROM curriculum_edges edge
        INNER JOIN reachable r ON r.id = edge.parent_node_id
      )
      SELECT r.exam_id AS examId, COUNT(*) AS n
      FROM reachable r
      INNER JOIN curriculum_nodes cn ON cn.id = r.id AND cn.node_type = 'CHAPTER'
      GROUP BY r.exam_id
    `) as unknown as Promise<[{ examId: string; n: number }[], unknown]>,
  ]);

  const out: Record<string, ExamSummaryStats> = {};
  const entry = (id: string) => (out[id] ??= { chapters: 0, mcqs: 0, pyqs: 0, mockTests: 0 });
  for (const r of chapterRows) entry(r.examId).chapters = Number(r.n);
  for (const r of mcqRows) entry(r.examId).mcqs = Number(r.n);
  for (const r of pyqRows) entry(r.examId).pyqs = Number(r.n);
  for (const r of mockRows) if (r.examId) entry(r.examId).mockTests = Number(r.n);
  return out;
}

async function findActiveExamIdBySlug(slug: string) {
  const [row] = await db
    .select({ id: exams.id })
    .from(exams)
    .where(and(eq(exams.slug, slug), eq(exams.status, 'ACTIVE')))
    .limit(1);
  return row?.id ?? null;
}

export type PlatformStats = Awaited<ReturnType<typeof getPlatformStats>>;
export type ExamSpotlight = Awaited<ReturnType<typeof getSpotlight>>;

export const examSpotlightRepository = {
  getSpotlight,
  getDailyProblem,
  getStats,
  getAllExamSummaries,
  getProgramStats,
  getPlatformStats,
  findActiveExamIdBySlug,
};
