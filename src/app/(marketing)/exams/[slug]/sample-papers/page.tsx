import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadSamplePaperExam } from '@/server/services/sample-papers';
import { SamplePaperShell, JsonLd } from '@/components/sample-papers/sample-paper-shell';
import { SamplePaperStepper, samplePaperSteps } from '@/components/sample-papers/sample-paper-stepper';
import { YearGrid, summariseYears } from '@/components/sample-papers/year-grid';
import { SamplePaperFaq } from '@/components/sample-papers/sample-paper-faq';
import { SamplePapersEmpty } from '@/components/sample-papers/sample-papers-empty';
import { emptyHubMetadata, hubFaqs, hubMetadata } from '@/components/sample-papers/seo';
import { examEvent, periodLabel, samplePapersPath } from '@/lib/sample-papers';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';

// Step 1 of 3 (session/year → subject → paper), for every ACTIVE exam. A static segment, so
// it wins over /exams/[slug]/[...path]. ISR-cached; admin writes purge it
// (revalidateSamplePaperPages).
export const revalidate = 3600;

// No paths at build time (the build has no DB); each page renders on first visit and is
// then served from the ISR cache. Returning [] is what enables that for dynamic segments.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadSamplePaperExam(slug);
  if (!data) return {};
  return data.latestYear === null ? emptyHubMetadata(slug, data.config) : hubMetadata(slug, data.config, data.latestYear);
}

export default async function SamplePapersHubPage({ params }: Props) {
  const { slug } = await params;
  const data = await loadSamplePaperExam(slug);
  if (!data) notFound();

  const { config, papers, latestYear } = data;
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Exams', href: '/exams' },
    { label: config.label, href: `/exams/${slug}` },
    { label: 'Sample Papers' },
  ];

  // Nothing published yet: a helpful page instead of an error (kept out of search via noindex).
  if (latestYear === null) {
    return (
      <SamplePaperShell
        crumbs={crumbs}
        eyebrow={config.eyebrow}
        title={`${config.label} Sample Papers`}
        intro={<p>Official {config.label} sample papers and marking schemes, subject by subject, as soon as they are released.</p>}
        relatedTitle=""
        related={[]}
      >
        <SamplePapersEmpty examSlug={slug} examLabel={config.label} />
      </SamplePaperShell>
    );
  }

  const years = summariseYears(papers);
  const unit = config.isBoard ? 'session' : 'year';
  const title = `${config.label} Sample Papers ${periodLabel(config, latestYear)} with Marking Scheme`;
  const { steps, current } = samplePaperSteps(slug, config);

  return (
    <SamplePaperShell
      crumbs={crumbs}
      eyebrow={config.eyebrow}
      title={title}
      intro={
        <p>
          Read the official {config.label} sample papers and marking schemes for every subject. They follow the current syllabus and paper design, so they are the
          most reliable guide to your {examEvent(config, latestYear)}. Choose a {unit} to begin.
        </p>
      }
      relatedTitle={`Continue your ${config.label} preparation`}
      related={[
        { label: `${config.label} preparation hub`, description: 'Syllabus, paper pattern, notes and study plan', href: `/exams/${slug}` },
        { label: 'Practice questions', description: 'Chapter-wise questions with worked solutions', href: `/practice/exams/${slug}` },
        { label: 'Mock tests', description: 'Timed tests on the exam pattern', href: '/mocks' },
      ]}
    >
      <SamplePaperStepper steps={steps} current={current} />

      <section aria-labelledby="sessions-heading">
        <h2 id="sessions-heading" className="text-headline-md text-foreground">
          Choose a {unit}
        </h2>
        <p className="text-body-md mt-1.5 text-muted-foreground">Start with the latest paper; earlier {unit}s are good extra practice on the same chapters.</p>
        <div className="mt-6">
          <YearGrid examSlug={slug} cfg={config} years={years} />
        </div>
      </section>

      <SamplePaperFaq title={`${config.label} sample papers: common questions`} faqs={hubFaqs(config, latestYear)} />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          url: new URL(samplePapersPath(slug), SITE_URL).toString(),
          publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: years.length,
            itemListElement: years.map((y, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: `${config.label} Sample Paper ${periodLabel(config, y.year)}`,
              url: new URL(samplePapersPath(slug, y.year), SITE_URL).toString(),
            })),
          },
        }}
      />
    </SamplePaperShell>
  );
}
