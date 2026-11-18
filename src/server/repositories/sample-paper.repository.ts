import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { exams, samplePaperDownloads, samplePapers, users } from '@/server/db/schema';
import { slugify } from '@/lib/utils';
import { SAMPLE_PAPER_EXAM_SLUGS } from '@/lib/sample-papers';
import type { SamplePaperInput } from '@/schemas/sample-paper.schema';

export type SamplePaper = typeof samplePapers.$inferSelect;

/** What public pages get — never the stored links (those stay behind the file proxy). */
export type PublicSamplePaper = Pick<SamplePaper, 'id' | 'year' | 'subject' | 'subjectSlug' | 'updatedAt'> & { hasMarkingScheme: boolean };

const publicColumns = {
  id: samplePapers.id,
  year: samplePapers.year,
  subject: samplePapers.subject,
  subjectSlug: samplePapers.subjectSlug,
  updatedAt: samplePapers.updatedAt,
  markingSchemeLink: samplePapers.markingSchemeLink,
};

function toPublic({ markingSchemeLink, ...row }: { markingSchemeLink: string | null } & Omit<PublicSamplePaper, 'hasMarkingScheme'>): PublicSamplePaper {
  return { ...row, hasMarkingScheme: !!markingSchemeLink };
}

// ── Public reads (published only) ──────────────────────────────────────────────

/** Every published paper for an exam, newest year first, subjects A–Z. */
async function listPublishedByExam(examId: string): Promise<PublicSamplePaper[]> {
  const rows = await db
    .select(publicColumns)
    .from(samplePapers)
    .where(and(eq(samplePapers.examId, examId), eq(samplePapers.isPublished, true)))
    .orderBy(desc(samplePapers.year), asc(samplePapers.subject));
  return rows.map(toPublic);
}

/** Exams that have sample papers (the CBSE boards) and are ACTIVE. */
const isListedExam = () => and(eq(exams.status, 'ACTIVE'), inArray(exams.slug, SAMPLE_PAPER_EXAM_SLUGS));

/** Published papers across the sample-paper exams, with the exam slug — for the sitemap. */
async function listPublishedForSitemap() {
  return db
    .select({ examSlug: exams.slug, year: samplePapers.year, subjectSlug: samplePapers.subjectSlug, updatedAt: samplePapers.updatedAt })
    .from(samplePapers)
    .innerJoin(exams, eq(samplePapers.examId, exams.id))
    .where(and(eq(samplePapers.isPublished, true), isListedExam()));
}

/** Sample-paper exams with at least one published paper (slug + name) — for site-wide links. */
async function listExamsWithPublished() {
  return db
    .selectDistinct({ slug: exams.slug, name: exams.name })
    .from(samplePapers)
    .innerJoin(exams, eq(samplePapers.examId, exams.id))
    .where(and(eq(samplePapers.isPublished, true), isListedExam()))
    .orderBy(asc(exams.name));
}

// ── Admin ──────────────────────────────────────────────────────────────────────

async function listAll() {
  const downloads = db
    .select({ samplePaperId: samplePaperDownloads.samplePaperId, total: count().as('total') })
    .from(samplePaperDownloads)
    .groupBy(samplePaperDownloads.samplePaperId)
    .as('downloads');

  const rows = await db
    .select({
      paper: samplePapers,
      examName: exams.name,
      examSlug: exams.slug,
      createdByName: users.name,
      downloads: downloads.total,
    })
    .from(samplePapers)
    .innerJoin(exams, eq(samplePapers.examId, exams.id))
    .leftJoin(users, eq(samplePapers.createdBy, users.id))
    .leftJoin(downloads, eq(downloads.samplePaperId, samplePapers.id))
    .orderBy(asc(exams.name), desc(samplePapers.year), asc(samplePapers.subject));
  return rows.map((r) => ({ ...r, downloads: Number(r.downloads ?? 0) }));
}

/** Exams papers can be attached to: the ACTIVE CBSE boards (others have no sample-paper pages). */
async function listEligibleExams() {
  return db.select({ id: exams.id, name: exams.name, slug: exams.slug }).from(exams).where(isListedExam()).orderBy(asc(exams.name));
}

async function findById(id: string) {
  const [row] = await db.select().from(samplePapers).where(eq(samplePapers.id, id)).limit(1);
  return row ?? null;
}

function toRow(input: SamplePaperInput) {
  return {
    examId: input.examId,
    year: input.year,
    subject: input.subject,
    subjectSlug: slugify(input.subject),
    samplePaperLink: input.samplePaperLink,
    markingSchemeLink: input.markingSchemeLink || null,
    isPublished: input.isPublished,
  };
}

async function create(input: SamplePaperInput, createdBy: string | null) {
  const id = crypto.randomUUID();
  await db.insert(samplePapers).values({ ...toRow(input), id, createdBy });
  return findById(id);
}

async function update(id: string, input: SamplePaperInput) {
  await db
    .update(samplePapers)
    .set({ ...toRow(input), updatedAt: new Date() })
    .where(eq(samplePapers.id, id));
  return findById(id);
}

async function recordDownload(input: { samplePaperId: string; userId: string; document: 'PAPER' | 'SCHEME'; userAgent: string | null }) {
  await db.insert(samplePaperDownloads).values({ ...input, userAgent: input.userAgent?.slice(0, 255) ?? null });
}

async function remove(id: string) {
  await db.delete(samplePapers).where(eq(samplePapers.id, id));
}

export const samplePaperRepository = {
  listPublishedByExam,
  listPublishedForSitemap,
  listExamsWithPublished,
  listAll,
  listEligibleExams,
  findById,
  create,
  update,
  recordDownload,
  remove,
};
