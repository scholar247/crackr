// Shared sample-paper config and URL helpers — no server imports, so safe for client
// components too. Sample papers exist only for the exams in SAMPLE_PAPER_EXAMS (the CBSE
// boards): their pages are inner pages of the CBSE landing at /exams/{slug}/sample-papers,
// and the admin panel, sitemap and footer only offer these exams.

export interface SamplePaperExamConfig {
  /** Short name used in titles and headings: "CBSE Class 10", "NIMCET". */
  label: string;
  /** Small caps line above the H1: "CBSE · Class 10". */
  eyebrow: string;
  /** schema.org educationalLevel. */
  educationalLevel: string;
  /** Board exams are labelled by session ("2025-26"); entrance exams by year ("2026"). */
  isBoard: boolean;
  /** Body that sets the papers, credited in structured data when known. */
  creator?: { name: string; alternateName?: string; url: string };
}

const CBSE = { name: 'Central Board of Secondary Education', alternateName: 'CBSE', url: 'https://www.cbse.gov.in' };

export const SAMPLE_PAPER_EXAMS: Record<string, SamplePaperExamConfig> = {
  'cbse-class-10-board': { label: 'CBSE Class 10', eyebrow: 'CBSE · Class 10', educationalLevel: 'Secondary School (Class 10)', isBoard: true, creator: CBSE },
  'cbse-class-12-board': { label: 'CBSE Class 12', eyebrow: 'CBSE · Class 12', educationalLevel: 'Senior Secondary School (Class 12)', isBoard: true, creator: CBSE },
};

/** Slugs of the exams that have sample papers. */
export const SAMPLE_PAPER_EXAM_SLUGS = Object.keys(SAMPLE_PAPER_EXAMS);

export function isSamplePaperExam(slug: string): boolean {
  return slug in SAMPLE_PAPER_EXAMS;
}

/** Wording for an exam's sample papers; the fallback only covers legacy rows under other exams. */
export function samplePaperExamConfig(exam: { slug: string; name: string }): SamplePaperExamConfig {
  return SAMPLE_PAPER_EXAMS[exam.slug] ?? { label: exam.name, eyebrow: `${exam.name} · Sample papers`, educationalLevel: exam.name, isBoard: false };
}

/** `year` is the exam year; boards label papers by session, so 2026 → "2025-26". */
export function sessionLabel(year: number): string {
  return `${year - 1}-${String(year).slice(-2)}`;
}

/** How a paper's year is shown for this exam: "2025-26" (board) or "2026" (entrance). */
export function periodLabel(cfg: SamplePaperExamConfig, year: number): string {
  return cfg.isBoard ? sessionLabel(year) : String(year);
}

/** The sitting a paper prepares for: "2026 board exam" or "NIMCET 2026". */
export function examEvent(cfg: SamplePaperExamConfig, year: number): string {
  return cfg.isBoard ? `${year} board exam` : `${cfg.label} ${year}`;
}

export function samplePapersPath(examSlug: string, year?: number, subjectSlug?: string): string {
  let path = `/exams/${examSlug}/sample-papers`;
  if (year !== undefined) path += `/${year}`;
  if (subjectSlug) path += `/${subjectSlug}`;
  return path;
}

export type SamplePaperDoc = 'paper' | 'scheme';

/** Same-origin, inline-only PDF stream the viewer reads from (never the stored link). */
export function samplePaperFileUrl(id: string, doc: SamplePaperDoc): string {
  return `/api/v1/public/sample-papers/${id}/file?doc=${doc}`;
}

/** Internal media link uploaded through /api/v1/media — captures the media slug. */
export const MEDIA_CONTENT_LINK = /^\/api\/v1\/media\/([a-z0-9-]+)\/content$/;

/** Signed-in download (recorded server-side); signed-out visitors are sent to sign-in. */
export function samplePaperDownloadUrl(id: string, doc: SamplePaperDoc): string {
  return `/api/v1/sample-papers/${id}/download?doc=${doc}`;
}
