import Link from 'next/link';
import { BookOpen, ListChecks } from 'lucide-react';
import { SectionNav } from '@/components/exam-landing/shared/section-nav';
import { FaqSection } from '@/components/exam-landing/shared/faq-section';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import { OfficialSourceNote } from '@/components/exam-landing/shared/source-note';
import { NIMCET_FAQS } from '@/content/exams/nimcet/faqs';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import { SYLLABUS_SOURCE, TOTAL_TOPICS, TOTAL_UNITS } from '@/content/exams/nimcet/syllabus';
import type { NimcetData } from '@/server/services/exam-landing/nimcet';
import { NimcetHero } from './hero';
import { ExamOverview } from './exam-overview';
import { PrepPaths } from './prep-paths';
import { SubjectCards } from './subject-cards';
import { NimcetSyllabusExplorer } from './syllabus-explorer';
import { PracticeModule } from './practice-module';
import { MockSection } from './mock-section';
import { StudyPlanTeaser } from './study-plan-teaser';
import { PrepTracker } from './prep-tracker';
import { CollegesTeaser } from './colleges-teaser';
import { NimcetFinalCta } from './final-cta';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'paths', label: 'Get started' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'syllabus', label: 'Syllabus' },
  { id: 'practice', label: 'Practice' },
  { id: 'mocks', label: 'Mock tests' },
  { id: 'plan', label: 'Study plan' },
  { id: 'tracker', label: 'Tracker' },
  { id: 'colleges', label: 'Colleges' },
  { id: 'faq', label: 'FAQ' },
];

// Section order follows the student journey: what is this exam → where do I start → what do
// I study → practise → test → plan → track → where can it take me → remaining questions.
export function NimcetLanding({ data }: { data: NimcetData }) {
  const { subjects, stats, links, signedIn } = data;

  return (
    <main>
      <NimcetHero questionCount={stats.mcqs} />
      <SectionNav items={NAV_ITEMS} />
      <ExamOverview />
      <PrepPaths signedIn={signedIn} questionCount={stats.mcqs} />

      <LandingSection id="subjects">
        <SectionHeader
          eyebrow="Subjects"
          icon={<BookOpen className="h-3.5 w-3.5" />}
          title="The four NIMCET subjects"
          description="Each subject has its own page with the official units, how to approach it, and practice where questions are available."
        />
        <div className="mt-8">
          <SubjectCards subjects={subjects} />
        </div>
      </LandingSection>

      <LandingSection id="syllabus" muted>
        <SectionHeader
          eyebrow="Syllabus"
          icon={<ListChecks className="h-3.5 w-3.5" />}
          title="Complete syllabus explorer"
          description={`All ${TOTAL_TOPICS} topics across ${TOTAL_UNITS} units, from the official syllabus. Search for a topic, or open a subject to see its units.`}
          action={
            <Link href={`${NIMCET_PATH}/syllabus`} className="text-sm font-semibold text-primary hover:underline">
              Full syllabus page →
            </Link>
          }
        />
        <NimcetSyllabusExplorer subjects={subjects} />
        <OfficialSourceNote source={SYLLABUS_SOURCE} className="mt-4" />
      </LandingSection>

      <PracticeModule
        examSlug={data.exam.slug}
        subjects={subjects}
        dailyProblem={data.dailyProblem}
        totalQuestions={stats.mcqs}
        pyqs={stats.pyqs}
        practiceHref={links.practice}
        buildMockHref={links.buildMock}
        signedIn={signedIn}
      />
      <MockSection mocks={data.mocks} signedIn={signedIn} buildMockHref={links.buildMock} />
      <StudyPlanTeaser />
      <PrepTracker signedIn={signedIn} progress={data.progress} subjects={subjects} buildMockHref={links.buildMock} />
      <CollegesTeaser />
      <FaqSection title="NIMCET: common questions" faqs={NIMCET_FAQS} />
      <NimcetFinalCta practiceHref={links.practice} />
    </main>
  );
}
