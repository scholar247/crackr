import { notFound, redirect } from 'next/navigation';
import { BookOpen, CalendarDays, FileCheck2, GraduationCap } from 'lucide-react';
import type { ExamSubpage } from '@/components/exam-landing/registry';
import type { Crumb } from '@/components/exam-landing/shared/breadcrumbs';
import { ExamPageShell, SECTION_HEADING, type NextStep } from '@/components/exam-landing/shared/exam-page-shell';
import { MobileDock } from '../mobile-dock';
import { JsonLd } from '@/components/exam-landing/shared/json-ld';
import { SamplePaperStepper, samplePaperSteps } from '@/components/sample-papers/sample-paper-stepper';
import { YearGrid, summariseYears } from '@/components/sample-papers/year-grid';
import { YearNav } from '@/components/sample-papers/year-nav';
import { SamplePaperGrid } from '@/components/sample-papers/sample-paper-grid';
import { toCardPapers } from '@/components/sample-papers/sample-paper-card';
import { SamplePaperFaq } from '@/components/sample-papers/sample-paper-faq';
import { SamplePapersEmpty } from '@/components/sample-papers/sample-papers-empty';
import { PaperDocumentTabs } from '@/components/sample-papers/paper-document-tabs';
import { collectionJsonLd, emptyHubMetadata, hubFaqs, hubMetadata, paperFaqs, paperJsonLd, paperMetadata, yearMetadata } from '@/components/sample-papers/seo';
import { examEvent, periodLabel, samplePapersPath } from '@/lib/sample-papers';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';
import { formatDate } from '@/lib/utils';
import { loadSamplePaperExam, parseYearParam } from '@/server/services/sample-papers';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { CbseNav } from '../page-shell';
import { cbsePath, cbseSteps } from '../paths';

// The CBSE sample-paper flow — session → subject → paper — as inner pages of the CBSE
// landing (/exams/{slug}/sample-papers[/{year}[/{subject}]]). Sample papers exist only for
// the CBSE boards (see SAMPLE_PAPER_EXAMS in lib/sample-papers.ts).

type Data = NonNullable<Awaited<ReturnType<typeof loadSamplePaperExam>>>;

function Shell({
  board,
  crumbs,
  nextSteps,
  nextStepsTitle,
  ...rest
}: {
  board: CbseBoard;
  /** Crumbs after Home › Exams › CBSE Class N. */
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  intro: React.ReactNode;
  nextStepsTitle: string;
  nextSteps: NextStep[];
  children: React.ReactNode;
}) {
  return (
    <ExamPageShell
      {...rest}
      nav={<CbseNav board={board} current="sample-papers" />}
      sectionKey="sample-papers"
      dock={<MobileDock board={board} current="sample-papers" />}
      crumbs={[{ label: 'Home', href: '/' }, { label: 'Exams', href: '/exams' }, { label: board.label, href: cbsePath(board.examSlug) }, ...crumbs]}
      nextStepsTitle={nextStepsTitle}
      nextSteps={nextSteps}
    />
  );
}

// ── Step 1: sessions ───────────────────────────────────────────────────────────

function HubPage({ board, data }: { board: CbseBoard; data: Data }) {
  const slug = board.examSlug;
  const { config, papers, latestYear } = data;
  const steps = cbseSteps(board);
  const crumbs = [{ label: 'Sample Papers' }];

  // Nothing published yet: a helpful page instead of an error (kept out of search via noindex).
  if (latestYear === null) {
    return (
      <Shell
        board={board}
        crumbs={crumbs}
        eyebrow={config.eyebrow}
        title={`${config.label} Sample Papers`}
        intro={<p>Official {config.label} sample papers and marking schemes, subject by subject, as soon as they are released.</p>}
        nextStepsTitle=""
        nextSteps={[]}
      >
        <SamplePapersEmpty examSlug={slug} examLabel={config.label} />
      </Shell>
    );
  }

  const years = summariseYears(papers);
  const title = `${config.label} Sample Papers ${periodLabel(config, latestYear)} with Marking Scheme`;
  const { steps: stepper, current } = samplePaperSteps(slug, config);

  return (
    <Shell
      board={board}
      crumbs={crumbs}
      eyebrow={config.eyebrow}
      title={title}
      intro={
        <p>
          Read the official {config.label} sample papers and marking schemes for every subject. They follow the current syllabus and paper design, so they are the
          most reliable guide to your {examEvent(config, latestYear)}. Choose a session to begin.
        </p>
      }
      nextStepsTitle={`Continue your ${board.shortLabel} preparation`}
      nextSteps={[steps.overview, steps['paper-pattern'], steps.practice, steps['mock-tests']]}
    >
      <SamplePaperStepper steps={stepper} current={current} />

      <section aria-labelledby="sessions-heading">
        <h2 id="sessions-heading" className={SECTION_HEADING}>
          Choose a session
        </h2>
        <p className="text-body-md mt-1.5 text-muted-foreground">Start with the latest paper; earlier sessions are good extra practice on the same chapters.</p>
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
    </Shell>
  );
}

// ── Step 2: subjects for one session ───────────────────────────────────────────

function YearPage({ board, data, year }: { board: CbseBoard; data: Data; year: number }) {
  const slug = board.examSlug;
  const { config, years } = data;
  const papers = data.papers.filter((p) => p.year === year);
  const period = periodLabel(config, year);
  const title = `${config.label} Sample Paper ${period}: All Subjects`;
  const { steps: stepper, current } = samplePaperSteps(slug, config, year);
  const steps = cbseSteps(board);

  return (
    <Shell
      board={board}
      crumbs={[{ label: 'Sample Papers', href: samplePapersPath(slug) }, { label: period }]}
      eyebrow={`${config.eyebrow} · ${examEvent(config, year)}`}
      title={title}
      intro={
        <p>
          All {papers.length} official {config.label} sample question paper{papers.length === 1 ? '' : 's'} for {period}, each with its marking scheme where one was
          published. Choose a subject to read its paper.
        </p>
      }
      nextStepsTitle="More sample papers"
      nextSteps={[
        { label: `All ${config.label} sample papers`, description: 'Choose a different session', href: samplePapersPath(slug) },
        steps.overview,
        steps.practice,
      ]}
    >
      <SamplePaperStepper steps={stepper} current={current} />

      <section aria-labelledby="subjects-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="subjects-heading" className={SECTION_HEADING}>
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
    </Shell>
  );
}

// ── Step 3: the paper ──────────────────────────────────────────────────────────

function PaperPage({ board, data, paper }: { board: CbseBoard; data: Data; paper: Data['papers'][number] }) {
  const slug = board.examSlug;
  const { config, papers } = data;
  const period = periodLabel(config, paper.year);
  const name = `${config.label} ${paper.subject} Sample Paper ${period}`;
  const description = `Official ${name}${paper.hasMarkingScheme ? ' with marking scheme' : ''}, to read online.`;
  const { steps: stepper, current } = samplePaperSteps(slug, config, paper.year, { name: paper.subject, slug: paper.subjectSlug });
  const sameYear = papers.filter((p) => p.year === paper.year && p.id !== paper.id);
  const sameSubject = papers.filter((p) => p.subjectSlug === paper.subjectSlug && p.id !== paper.id);

  const facts = [
    { icon: <GraduationCap className="h-4 w-4" />, label: 'Exam', value: config.label },
    { icon: <BookOpen className="h-4 w-4" />, label: 'Subject', value: paper.subject },
    { icon: <CalendarDays className="h-4 w-4" />, label: 'Session', value: `${period} (${examEvent(config, paper.year)})` },
    { icon: <FileCheck2 className="h-4 w-4" />, label: 'Marking scheme', value: paper.hasMarkingScheme ? 'Included' : 'Not released' },
  ];

  return (
    <Shell
      board={board}
      crumbs={[
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
      nextStepsTitle="More sample papers"
      nextSteps={[
        ...sameSubject.slice(0, 3).map((p) => ({
          label: `${paper.subject} sample paper ${periodLabel(config, p.year)}`,
          description: `${config.label} · ${examEvent(config, p.year)}`,
          href: samplePapersPath(slug, p.year, p.subjectSlug),
        })),
        { label: `All ${period} sample papers`, description: `Every ${config.label} subject for ${period}`, href: samplePapersPath(slug, paper.year) },
        { label: `All ${config.label} sample papers`, description: 'Every subject across all sessions', href: samplePapersPath(slug) },
        cbseSteps(board).practice,
      ]}
    >
      <SamplePaperStepper steps={stepper} current={current} />

      <section aria-label={`${paper.subject} sample paper viewer`}>
        <PaperDocumentTabs paperId={paper.id} title={name} hasMarkingScheme={paper.hasMarkingScheme} />
      </section>

      <section aria-labelledby="about-heading">
        <h2 id="about-heading" className={SECTION_HEADING}>
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
        <h2 id="how-heading" className={SECTION_HEADING}>
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
          <h2 id="more-heading" className={SECTION_HEADING}>
            Other {config.label} sample papers {period}
          </h2>
          <div className="mt-5">
            <SamplePaperGrid examSlug={slug} papers={toCardPapers(sameYear)} />
          </div>
        </section>
      )}

      <SamplePaperFaq title={`${paper.subject} sample paper: common questions`} faqs={paperFaqs(config, paper)} />
      <JsonLd data={paperJsonLd(slug, config, paper, description)} />
    </Shell>
  );
}

// ── Resolution ─────────────────────────────────────────────────────────────────

/**
 * Where a sample-paper path leads: a page to render, or a path to redirect to (a session
 * with no papers or a mistyped year goes to the hub; a removed paper goes up to its
 * session if that still has papers). null → 404.
 */
async function resolve(examSlug: string, rest: string[]) {
  const data = await loadSamplePaperExam(examSlug);
  if (!data) return null;
  if (rest.length === 0) return { kind: 'hub' as const, data };

  const year = parseYearParam(rest[0]);
  const hasYear = year !== null && data.papers.some((p) => p.year === year);
  if (rest.length === 1) return hasYear ? { kind: 'year' as const, data, year: year! } : samplePapersPath(examSlug);

  const paper = data.papers.find((p) => p.year === year && p.subjectSlug === rest[1]);
  if (paper) return { kind: 'paper' as const, data, paper };
  return hasYear ? samplePapersPath(examSlug, year!) : samplePapersPath(examSlug);
}

/** The sample-paper inner page for `rest` (the path after /sample-papers), or null. */
export function samplePaperSubpage(board: CbseBoard, rest: string[]): ExamSubpage | null {
  if (rest.length > 2) return null;
  return {
    metadata: async (exam) => {
      const r = await resolve(exam.slug, rest);
      if (!r || typeof r === 'string') return {};
      if (r.kind === 'hub') return r.data.latestYear === null ? emptyHubMetadata(exam.slug, r.data.config) : hubMetadata(exam.slug, r.data.config, r.data.latestYear);
      if (r.kind === 'year') return yearMetadata(exam.slug, r.data.config, r.year, r.data.papers.filter((p) => p.year === r.year).length);
      return paperMetadata(exam.slug, r.data.config, r.paper);
    },
    render: async (exam) => {
      const r = await resolve(exam.slug, rest);
      if (!r) notFound();
      if (typeof r === 'string') redirect(r);
      if (r.kind === 'hub') return <HubPage board={board} data={r.data} />;
      if (r.kind === 'year') return <YearPage board={board} data={r.data} year={r.year} />;
      return <PaperPage board={board} data={r.data} paper={r.paper} />;
    },
  };
}
