import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { FaqSection } from '@/components/exam-landing/shared/faq-section';
import { JsonLd } from '@/components/exam-landing/shared/json-ld';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import type { CbseLandingData } from '@/server/services/exam-landing/cbse';
import { currentPhase } from '@/content/exams/cbse/types';
import { NotificationBoard, type BoardNotice } from '@/components/notifications/notification-board';
import { NotificationTicker } from '@/components/notifications/notification-ticker';
import { NotificationContent } from '@/components/notifications/notification-content';
import { CbseHero } from './hero';
import { CbseNav } from './page-shell';
import { QuickActions } from './quick-actions';
import { MindMapSpotlight } from './mind-map-spotlight';
import { MobileDock } from './mobile-dock';
import { ExamGlance } from './exam-glance';
import { SubjectResources } from './subject-resources';
import { NotesGrid } from './study-notes';
import { PrepRoadmap } from './prep-roadmap';
import { FinalCta } from './final-cta';
import { cbsePath, cbseSteps } from './paths';
import { absoluteUrl, collectionPageJsonLd } from './seo';

// The exam home: a hub that answers "where do I start?" and deep-links into each tool.
// Order: what's new (ticker + notification board, read in full here) and a countdown →
// quick actions → the mind-map spotlight (with the visitor's own "continue" row) → key
// facts → subjects → notes → where I am in the year → common questions. Phones and
// tablets also get an app-style bottom bar.
export function CbseLanding({ data }: { data: CbseLandingData }) {
  const { board, subjects, stats, links } = data;
  const phase = currentPhase(board.roadmap);
  const steps = cbseSteps(board);
  const slug = board.examSlug;

  // Bodies are rendered here, on the server, and handed to the client board as ready markup.
  const notices: BoardNotice[] = data.notifications.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    summary: n.summary,
    category: n.category,
    isImportant: n.isImportant,
    isNew: n.isNew,
    publishedAt: n.publishedAt.toISOString(),
    sourceUrl: n.sourceUrl,
    body: <NotificationContent markdown={n.content} />,
  }));

  return (
    <main id="top" className="scroll-mt-32 pb-20 lg:pb-0">
      <CbseNav board={board} current="overview" />
      <NotificationTicker
        notices={notices.slice(0, 8).map(({ id, slug: s, title, publishedAt, isImportant }) => ({ id, slug: s, title, publishedAt, isImportant }))}
      />
      <CbseHero
        board={board}
        practiceHref={links.practice}
        phase={phase}
        stats={stats}
        mindMapCount={data.mindMapCount}
        samplePaperCount={data.samplePaperCount}
        daysToExam={data.daysToExam}
        notifications={
          <NotificationBoard
            notices={notices}
            title={`${board.label} notifications`}
            emptyText={`New ${board.label} circulars, date sheets and results will appear here as soon as CBSE releases them.`}
          />
        }
      />

      <QuickActions
        board={board}
        counts={{
          subjects: stats.subjects,
          chapters: stats.chapters,
          mcqs: stats.mcqs,
          articles: stats.articles,
          mocks: data.mocks.length,
          samplePapers: data.samplePaperCount,
          mindMaps: data.mindMapCount,
        }}
      />

      <MindMapSpotlight board={board} maps={data.featuredMindMaps} />

      <ExamGlance board={board} />

      <SubjectResources board={board} subjects={subjects} examPracticeHref={links.practice} />

      {data.articles.length > 0 && (
        <LandingSection id="notes" muted>
          <SectionHeader
            eyebrow="Study material"
            icon={<BookOpen className="h-3.5 w-3.5" />}
            title={`Latest ${board.shortLabel} notes`}
            description={`Short explanations, solved examples and revision notes mapped to the ${board.shortLabel} syllabus.`}
            action={
              <Link href={cbsePath(slug, 'notes')} className="text-label-caps flex items-center gap-1.5 uppercase tracking-wider text-primary hover:text-primary/80">
                All {board.shortLabel} notes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="mt-8">
            <NotesGrid articles={data.articles.slice(0, 3)} classLabel={board.shortLabel} practiceHref={links.practice} />
          </div>
        </LandingSection>
      )}

      <PrepRoadmap board={board} current={phase} muted={false} />
      <FaqSection title={`${board.label}: common questions`} faqs={board.faqs} />
      <FinalCta practiceHref={links.practice} syllabusHref={cbsePath(slug, 'syllabus')} />

      <JsonLd
        data={collectionPageJsonLd({
          path: cbsePath(slug),
          name: `${board.label} Board Exam Preparation`,
          description: board.heroDescription,
          items: (['syllabus', 'paper-pattern', 'practice', 'mind-maps', 'notes', 'mock-tests', 'sample-papers'] as const).map((k) => ({
            name: steps[k].label,
            path: steps[k].href,
          })),
        })}
      />
      {data.featuredMindMaps.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${board.label} chapter mind maps`,
            itemListElement: data.featuredMindMaps.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: `${m.subject} — ${m.chapter} mind map`, url: absoluteUrl(m.href) })),
          }}
        />
      )}

      <MobileDock board={board} current="overview" practiceHref={links.practice} hasMindMaps={data.mindMapCount > 0} newNotices={data.notifications.filter((n) => n.isNew).length} />
    </main>
  );
}
