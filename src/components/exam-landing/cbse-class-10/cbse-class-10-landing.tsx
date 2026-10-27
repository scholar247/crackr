import { SectionNav } from '@/components/exam-landing/shared/section-nav';
import { FaqSection } from '@/components/exam-landing/shared/faq-section';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import type { CbseClass10LandingData } from '@/server/services/exam-landing/cbse-class-10';
import { ListChecks } from 'lucide-react';
import { FAQS, currentPhase } from './content';
import { CbseHero } from './hero';
import { QuickActions } from './quick-actions';
import { SyllabusExplorer } from './syllabus-explorer';
import { PaperPattern } from './paper-pattern';
import { PracticeSection } from './practice-section';
import { StudyNotes } from './study-notes';
import { MockTests } from './mock-tests';
import { PrepRoadmap } from './prep-roadmap';
import { FinalCta } from './final-cta';

const NAV_ITEMS = [
  { id: 'syllabus', label: 'Syllabus' },
  { id: 'pattern', label: 'Paper pattern' },
  { id: 'practice', label: 'Practice' },
  { id: 'notes', label: 'Notes' },
  { id: 'mocks', label: 'Mock tests' },
  { id: 'roadmap', label: 'Study plan' },
  { id: 'faq', label: 'FAQ' },
];

// Section order follows a Class 10 student's questions in order: what's in the syllabus →
// how is the paper set → let me practise → where do I read → am I ready → what's the plan.
export function CbseClass10Landing({ data }: { data: CbseClass10LandingData }) {
  const { exam, subjects, stats, links } = data;
  const phase = currentPhase();

  return (
    <main>
      <CbseHero examName={exam.name} practiceHref={links.practice} phase={phase} stats={stats} />
      <QuickActions
        practiceHref={links.practice}
        mcqs={stats.mcqs}
        pyqs={stats.pyqs}
        hasDailyProblem={!!data.dailyProblem}
        hasChapterPractice={subjects.some((s) => s.chapters.some((c) => c.questionCount > 0))}
        articleCount={data.articles.length}
        mockCount={data.mocks.length}
      />
      <SectionNav items={NAV_ITEMS} />

      <LandingSection id="syllabus">
        <SectionHeader
          eyebrow="Syllabus"
          icon={<ListChecks className="h-3.5 w-3.5" />}
          title="Class 10 syllabus, chapter by chapter"
          description="Choose a subject to see its chapters. Practise any chapter on its own, or the whole subject at once."
        />
        <SyllabusExplorer subjects={subjects} examPracticeHref={links.practice} />
      </LandingSection>

      <PaperPattern subjects={subjects} />
      <PracticeSection
        exam={exam}
        dailyProblem={data.dailyProblem}
        subjects={subjects}
        practiceHref={links.practice}
        totalQuestions={stats.mcqs}
        signedIn={data.signedIn}
        progress={data.progress}
      />
      <StudyNotes articles={data.articles} notesHref={links.notes} practiceHref={links.practice} />
      <MockTests mocks={data.mocks} signedIn={data.signedIn} />
      <PrepRoadmap current={phase} />
      <FaqSection title="CBSE Class 10: common questions" faqs={FAQS} />
      <FinalCta practiceHref={links.practice} />
    </main>
  );
}
