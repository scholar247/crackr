import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { BookOpen, CalendarDays, FileCheck2, GraduationCap } from 'lucide-react';
import { loadSamplePaperExam, parseYearParam } from '@/server/services/sample-papers';
import { SamplePaperShell, JsonLd } from '@/components/sample-papers/sample-paper-shell';
import { SamplePaperGrid } from '@/components/sample-papers/sample-paper-grid';
import { toCardPapers } from '@/components/sample-papers/sample-paper-card';
import { SamplePaperStepper, samplePaperSteps } from '@/components/sample-papers/sample-paper-stepper';
import { SamplePaperFaq } from '@/components/sample-papers/sample-paper-faq';
import { PaperDocumentTabs } from '@/components/sample-papers/paper-document-tabs';
import { paperFaqs, paperJsonLd, paperMetadata } from '@/components/sample-papers/seo';
import { examEvent, periodLabel, samplePapersPath } from '@/lib/sample-papers';
import { formatDate } from '@/lib/utils';

// Step 3 of 3: the paper itself.
export const revalidate = 3600;

// No paths at build time (the build has no DB); each page renders on its first visit and
// is then served from the ISR cache. Returning [] is what enables that for dynamic segments.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; year: string; subject: string }> };

/**
 * The paper, or where to send the visitor instead: null → 404 (no such exam); a path →
 * redirect back up the flow (paper unpublished/removed or a mistyped URL), to that year's
 * subjects if the year still has papers, otherwise the hub.
 */
async function load(slug: string, rawYear: string, subjectSlug: string) {
  const data = await loadSamplePaperExam(slug);
  if (!data) return null;
  const year = parseYearParam(rawYear);
  const paper = data.papers.find((p) => p.year === year && p.subjectSlug === subjectSlug);
  if (paper) return { ...data, paper };
  return year && data.papers.some((p) => p.year === year) ? samplePapersPath(slug, year) : samplePapersPath(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, year, subject } = await params;
  const data = await load(slug, year, subject);
  return data && typeof data === 'object' ? paperMetadata(slug, data.config, data.paper) : {};
}

export default async function SamplePaperPage({ params }: Props) {
  const { slug, year: rawYear, subject } = await params;
  const data = await load(slug, rawYear, subject);
  if (!data) notFound();
  if (typeof data === 'string') redirect(data);

  const { config, paper, papers } = data;
  const period = periodLabel(config, paper.year);
  const name = `${config.label} ${paper.subject} Sample Paper ${period}`;
  const description = `Official ${name}${paper.hasMarkingScheme ? ' with marking scheme' : ''}, to read online.`;

  const { steps, current } = samplePaperSteps(slug, config, paper.year, { name: paper.subject, slug: paper.subjectSlug });
  const sameYear = papers.filter((p) => p.year === paper.year && p.id !== paper.id);
  const sameSubject = papers.filter((p) => p.subjectSlug === paper.subjectSlug && p.id !== paper.id);

  const facts = [
    { icon: <GraduationCap className="h-4 w-4" />, label: 'Exam', value: config.label },
    { icon: <BookOpen className="h-4 w-4" />, label: 'Subject', value: paper.subject },
    {
      icon: <CalendarDays className="h-4 w-4" />,
      label: config.isBoard ? 'Session' : 'Year',
      value: config.isBoard ? `${period} (${examEvent(config, paper.year)})` : period,
    },
    { icon: <FileCheck2 className="h-4 w-4" />, label: 'Marking scheme', value: paper.hasMarkingScheme ? 'Included' : 'Not released' },
  ];

  return (
    <SamplePaperShell
      crumbs={[
        { label: 'Home', href: '/' },
        { label: 'Exams', href: '/exams' },
        { label: config.label, href: `/exams/${slug}` },
        { label: 'Sample Papers', href: samplePapersPath(slug) },
        { label: period, href: samplePapersPath(slug, paper.year) },
        { label: paper.subject },
      ]}
      eyebrow={`${config.eyebrow} · ${period}`}
      title={`${name}${paper.hasMarkingScheme ? ' with Marking Scheme' : ''}`}
      intro={
        <p>
          The official {config.label} {paper.subject} sample question paper for {period}
          {paper.hasMarkingScheme ? ', with the marking scheme examiners use' : ''}. Solve it in one sitting, then check every answer against the marking scheme to see
          exactly where marks are awarded in the {examEvent(config, paper.year)}.
        </p>
      }
      relatedTitle="More sample papers"
      related={[
        ...sameSubject.slice(0, 3).map((p) => ({
          label: `${paper.subject} sample paper ${periodLabel(config, p.year)}`,
          description: `${config.label} · ${examEvent(config, p.year)}`,
          href: samplePapersPath(slug, p.year, p.subjectSlug),
        })),
        { label: `All ${period} sample papers`, description: `Every ${config.label} subject for ${period}`, href: samplePapersPath(slug, paper.year) },
        { label: `All ${config.label} sample papers`, description: config.isBoard ? 'Every subject across all sessions' : 'Every subject across all years', href: samplePapersPath(slug) },
        { label: 'Practice questions', description: 'Chapter-wise questions with worked solutions', href: `/practice/exams/${slug}` },
      ]}
    >
      <SamplePaperStepper steps={steps} current={current} />

      <section aria-label={`${paper.subject} sample paper viewer`}>
        <PaperDocumentTabs paperId={paper.id} title={name} hasMarkingScheme={paper.hasMarkingScheme} />
      </section>

      <section aria-labelledby="about-heading">
        <h2 id="about-heading" className="text-headline-md text-foreground">
          About this sample paper
        </h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{f.icon}</span>
              <div className="min-w-0">
                <dt className="text-label-caps uppercase text-muted-foreground">{f.label}</dt>
                <dd className="text-body-md font-semibold text-foreground">{f.value}</dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="text-body-sm mt-3 text-muted-foreground">Last updated {formatDate(paper.updatedAt)}.</p>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-headline-md text-foreground">
          How to practise with the {paper.subject} sample paper
        </h2>
        <ol className="text-body-md mt-4 list-decimal space-y-2 pl-5 text-muted-foreground marker:font-semibold marker:text-primary">
          <li>Read the general instructions and every section first, and plan how much time each one gets.</li>
          <li>Solve the full paper in one sitting within the time limit, on paper, without notes.</li>
          {paper.hasMarkingScheme && <li>Switch to the Marking scheme tab and mark your own answers point by point.</li>}
          <li>List the chapters where you lost marks, revise them, then practise those chapters before the next paper.</li>
        </ol>
      </section>

      {sameYear.length > 0 && (
        <section aria-labelledby="more-heading">
          <h2 id="more-heading" className="text-headline-md text-foreground">
            Other {config.label} sample papers {period}
          </h2>
          <div className="mt-5">
            <SamplePaperGrid examSlug={slug} papers={toCardPapers(sameYear)} />
          </div>
        </section>
      )}

      <SamplePaperFaq title={`${paper.subject} sample paper: common questions`} faqs={paperFaqs(config, paper)} />
      <JsonLd data={paperJsonLd(slug, config, paper, description)} />
    </SamplePaperShell>
  );
}
