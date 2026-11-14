import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { loadSamplePaperExam, parseYearParam } from '@/server/services/sample-papers';
import { SamplePaperShell, JsonLd } from '@/components/sample-papers/sample-paper-shell';
import { SamplePaperStepper, samplePaperSteps } from '@/components/sample-papers/sample-paper-stepper';
import { SamplePaperGrid } from '@/components/sample-papers/sample-paper-grid';
import { toCardPapers } from '@/components/sample-papers/sample-paper-card';
import { YearNav } from '@/components/sample-papers/year-nav';
import { collectionJsonLd, yearMetadata } from '@/components/sample-papers/seo';
import { examEvent, periodLabel, samplePapersPath } from '@/lib/sample-papers';

// Step 2 of 3: subjects for one session/year.
export const revalidate = 3600;

// See ../page.tsx: [] enables on-demand ISR for this dynamic segment.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; year: string }> };

/** null → 404 (no such exam); 'hub' → redirect to the hub (no papers for this year, or a mistyped year). */
async function load(slug: string, rawYear: string) {
  const data = await loadSamplePaperExam(slug);
  if (!data) return null;
  const year = parseYearParam(rawYear);
  const papers = year ? data.papers.filter((p) => p.year === year) : [];
  return year && papers.length ? { ...data, year, papers } : ('hub' as const);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, year } = await params;
  const data = await load(slug, year);
  return data && data !== 'hub' ? yearMetadata(slug, data.config, data.year, data.papers.length) : {};
}

export default async function SamplePapersYearPage({ params }: Props) {
  const { slug, year: rawYear } = await params;
  const data = await load(slug, rawYear);
  if (!data) notFound();
  if (data === 'hub') redirect(samplePapersPath(slug));

  const { config, papers, years, year } = data;
  const period = periodLabel(config, year);
  const title = `${config.label} Sample Paper ${period}: All Subjects`;
  const { steps, current } = samplePaperSteps(slug, config, year);

  return (
    <SamplePaperShell
      crumbs={[
        { label: 'Home', href: '/' },
        { label: 'Exams', href: '/exams' },
        { label: config.label, href: `/exams/${slug}` },
        { label: 'Sample Papers', href: samplePapersPath(slug) },
        { label: period },
      ]}
      eyebrow={`${config.eyebrow} · ${examEvent(config, year)}`}
      title={title}
      intro={
        <p>
          All {papers.length} official {config.label} sample question paper{papers.length === 1 ? '' : 's'} for {period}, each with its marking scheme where one was
          published. Choose a subject to read its paper.
        </p>
      }
      relatedTitle="More sample papers"
      related={[
        { label: `All ${config.label} sample papers`, description: config.isBoard ? 'Choose a different session' : 'Choose a different year', href: samplePapersPath(slug) },
        { label: `${config.label} preparation hub`, description: 'Syllabus, paper pattern, notes and study plan', href: `/exams/${slug}` },
        { label: 'Practice questions', description: 'Chapter-wise questions with worked solutions', href: `/practice/exams/${slug}` },
      ]}
    >
      <SamplePaperStepper steps={steps} current={current} />

      <section aria-labelledby="subjects-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="subjects-heading" className="text-headline-md text-foreground">
              Choose a subject
            </h2>
            <p className="text-body-md mt-1.5 text-muted-foreground">
              {papers.length} subject{papers.length === 1 ? '' : 's'} for {period}
            </p>
          </div>
          {years.length > 1 && <YearNav examSlug={slug} cfg={config} years={years} current={year} />}
        </div>
        <div className="mt-6">
          <SamplePaperGrid examSlug={slug} papers={toCardPapers(papers)} searchable />
        </div>
      </section>

      <JsonLd data={collectionJsonLd(samplePapersPath(slug, year), title, `Official ${config.label} sample papers for ${period}`, slug, config, papers)} />
    </SamplePaperShell>
  );
}
