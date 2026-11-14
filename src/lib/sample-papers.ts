// Shared sample-paper config and URL helpers — no server imports, so safe for client
// components too. Every ACTIVE exam has sample-paper pages at /exams/{slug}/sample-papers;
// SAMPLE_PAPER_EXAM_OVERRIDES only refines the wording for exams that need it (school
// boards label papers by session and are set by a named board), everything else is
// derived from the exam's own name.

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

export const SAMPLE_PAPER_EXAM_OVERRIDES: Record<string, SamplePaperExamConfig> = {
  'cbse-class-10-board': { label: 'CBSE Class 10', eyebrow: 'CBSE · Class 10', educationalLevel: 'Secondary School (Class 10)', isBoard: true, creator: CBSE },
  'cbse-class-12-board': { label: 'CBSE Class 12', eyebrow: 'CBSE · Class 12', educationalLevel: 'Senior Secondary School (Class 12)', isBoard: true, creator: CBSE },
};

export function samplePaperExamConfig(exam: { slug: string; name: string }): SamplePaperExamConfig {
  return SAMPLE_PAPER_EXAM_OVERRIDES[exam.slug] ?? { label: exam.name, eyebrow: `${exam.name} · Sample papers`, educationalLevel: exam.name, isBoard: false };
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
