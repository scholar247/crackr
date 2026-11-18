import { Suspense } from 'react';
import type { CbseLandingData } from '@/server/services/exam-landing/cbse';
import type { StreakSummary } from '@/server/services/daily-streak';
import { PageSection } from '@/components/exam-landing/shared/exam-page-shell';
import { JsonLd } from '@/components/exam-landing/shared/json-ld';
import { CbsePageShell } from '../page-shell';
import { PracticeSection } from '../practice-section';
import { PracticeFinder } from '../practice-finder';
import { PracticeDirectory } from '../practice-directory';
import { absoluteUrl } from '../seo';
import { cbsePath } from '../paths';

// Practice hub: today's question first (with streak, progress and next steps), then the
// subject → chapter → topic finder, then every chapter and topic as a crawlable link list.
export function CbsePracticePage({ data, today, streak }: { data: CbseLandingData; today: string; streak: StreakSummary | null }) {
  const { board, exam, subjects, stats, links } = data;
  const c = board.shortLabel;
  const chapterLinks = subjects.flatMap((s) => s.chapters.filter((ch) => ch.questionCount > 0).map((ch) => ({ name: `${c} ${s.name}: ${ch.name} MCQs`, href: ch.practiceHref })));

  return (
    <CbsePageShell
      board={board}
      current="practice"
      eyebrow={`CBSE · ${c} · Practice`}
      title={`${board.label} MCQ Practice with Solutions`}
      intro={
        // One string: JSX trims whitespace around line breaks in mixed text, which dropped spaces here.
        [
          stats.mcqs > 0 ? `${stats.mcqs.toLocaleString('en-IN')} practice question${stats.mcqs === 1 ? '' : 's'}` : 'Practice questions',
          stats.pyqs > 0 ? `, including ${stats.pyqs.toLocaleString('en-IN')} previous year questions,` : '',
          ` for every ${c} subject — each with a worked solution. Start with today's question, then pick a subject, chapter and topic to practise.`,
        ].join('')
      }
    >
      <PageSection id="daily" title={`Daily ${c} challenge`} description="A new question every day — answer it to build your streak, then keep going below.">
        <PracticeSection
          exam={exam}
          classLabel={c}
          dailyProblem={data.dailyProblem}
          practiceHref={links.practice}
          mockTestsHref={cbsePath(board.examSlug, 'mock-tests')}
          signedIn={data.signedIn}
          progress={data.progress}
          today={today}
          streak={streak}
        />
      </PageSection>

      <PageSection id="find" title={`Find ${c} MCQs by subject, chapter and topic`} description="Narrow down step by step — the button always shows how many questions you'll get.">
        {/* useSearchParams in the finder needs a Suspense boundary; the fallback keeps the layout steady. */}
        <Suspense fallback={<div className="h-64 rounded-2xl border border-border bg-card" />}>
          <PracticeFinder subjects={subjects} classLabel={c} totalQuestions={stats.mcqs} examPracticeHref={links.practice} />
        </Suspense>
      </PageSection>

      <PageSection id="chapters" title={`All ${c} MCQs by chapter and topic`} description="Every chapter and topic with questions — jump straight into the one you're revising.">
        <PracticeDirectory subjects={subjects} classLabel={c} />
      </PageSection>

      {chapterLinks.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${board.label} chapter-wise MCQs`,
            itemListElement: chapterLinks.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.name, url: absoluteUrl(l.href) })),
          }}
        />
      )}
    </CbsePageShell>
  );
}
