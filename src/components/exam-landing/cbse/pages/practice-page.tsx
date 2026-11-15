import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import type { CbseLandingData } from '@/server/services/exam-landing/cbse';
import { PageSection } from '@/components/exam-landing/shared/exam-page-shell';
import { CbsePageShell } from '../page-shell';
import { PracticeSection } from '../practice-section';
import { SubjectIcon } from '../subject-icon';

export function CbsePracticePage({ data }: { data: CbseLandingData }) {
  const { board, exam, subjects, stats, links } = data;
  const c = board.shortLabel;
  // Only chapters with published questions — a chapter link must never open an empty set.
  const chapterGroups = subjects
    .map((s) => ({ subject: s, chapters: s.chapters.filter((ch) => ch.questionCount > 0) }))
    .filter((g) => g.chapters.length > 0);

  return (
    <CbsePageShell
      board={board}
      current="practice"
      eyebrow={`CBSE · ${c} · Practice`}
      title={`${board.label} MCQ Practice with Solutions`}
      intro={
        <>
          {stats.mcqs > 0 ? `${stats.mcqs.toLocaleString('en-IN')} practice questions` : 'Practice questions'}
          {stats.pyqs > 0 ? `, including ${stats.pyqs.toLocaleString('en-IN')} previous year questions,` : ''} for every {c} subject — each with a worked
          solution. Start with the question of the day, then practise one subject or chapter at a time.
        </>
      }
    >
      <PageSection id="daily" title="Practise every day" description="One question a day keeps you in touch with every subject. Then go deeper, one subject at a time.">
        <PracticeSection
          exam={exam}
          classLabel={c}
          dailyProblem={data.dailyProblem}
          subjects={subjects}
          practiceHref={links.practice}
          totalQuestions={stats.mcqs}
          signedIn={data.signedIn}
          progress={data.progress}
        />
      </PageSection>

      {chapterGroups.length > 0 && (
        <PageSection id="chapters" title="Chapter-wise practice" description="Pick a chapter to practise only its questions.">
          <div className="grid gap-4 md:grid-cols-2">
            {chapterGroups.map(({ subject, chapters }) => (
              <div key={subject.id} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <SubjectIcon subjectKey={subject.key} className="text-secondary" /> {c} {subject.name} MCQs
                </h3>
                <ul className="mt-3 divide-y divide-border">
                  {chapters.map((ch) => (
                    <li key={ch.id}>
                      <Link href={ch.practiceHref} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary">
                        <span className="flex items-center gap-2 text-foreground">
                          <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden /> {ch.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{ch.questionCount} Qs</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </PageSection>
      )}
    </CbsePageShell>
  );
}
