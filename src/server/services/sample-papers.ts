import { cache } from 'react';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { samplePaperRepository } from '@/server/repositories/sample-paper.repository';
import { samplePaperExamConfig, samplePapersPath } from '@/lib/sample-papers';

const LINKS_TAG = 'sample-paper-links';

/**
 * Everything a public sample-paper page needs for any ACTIVE exam, or null when the exam
 * doesn't exist / is archived (→ 404). An exam with nothing published yet still returns
 * data (`papers: []`, `latestYear: null`) so pages can show an empty state instead of an
 * error. Memoised per request so generateMetadata and the page share one query.
 */
export const loadSamplePaperExam = cache(async (slug: string) => {
  const exam = await taxonomyRepository.findExamBySlug(slug);
  if (!exam || exam.status !== 'ACTIVE') return null;
  const config = samplePaperExamConfig(exam);
  const papers = await samplePaperRepository.listPublishedByExam(exam.id);
  const years = [...new Set(papers.map((p) => p.year))];
  return { exam, config, papers, years, latestYear: years[0] ?? null };
});

/**
 * Site-wide links (footer) to every exam's sample-paper hub that has published papers.
 * Rendered on every marketing page, so it's cached across requests and purged by tag on
 * admin writes rather than querying the DB per page view. Capped to keep the footer short.
 */
export const getSamplePaperLinks = unstable_cache(
  async () => {
    const examsWithPapers = await samplePaperRepository.listExamsWithPublished();
    // Boards first (they're the main audience), then alphabetical.
    return examsWithPapers
      .map((e) => ({ cfg: samplePaperExamConfig(e), slug: e.slug }))
      .sort((a, b) => Number(b.cfg.isBoard) - Number(a.cfg.isBoard) || a.cfg.label.localeCompare(b.cfg.label))
      .slice(0, 6)
      .map(({ cfg, slug }) => ({ label: `${cfg.label} Sample Papers`, href: samplePapersPath(slug) }));
  },
  ['sample-paper-links-v2'],
  { tags: [LINKS_TAG], revalidate: 3600 },
);

/** Route params arrive as strings; only a plain 4-digit year is a valid page. */
export function parseYearParam(raw: string): number | null {
  return /^\d{4}$/.test(raw) ? Number(raw) : null;
}

/**
 * Public sample-paper pages are ISR-cached (revalidate = 3600), and the footer on every
 * marketing page links to the hubs, so an admin write purges the whole tree immediately
 * rather than waiting out the hour. Writes are rare, so a site-wide purge is cheap enough.
 */
export function revalidateSamplePaperPages() {
  revalidateTag(LINKS_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
}
