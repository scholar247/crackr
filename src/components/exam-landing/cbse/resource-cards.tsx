import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, ClipboardCheck, FileStack, FileText, ListChecks, Target } from 'lucide-react';
import { LandingSection } from '@/components/exam-landing/shared/section-header';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { cbsePath, type CbseNavKey } from './paths';

interface Resource {
  key: CbseNavKey;
  icon: ReactNode;
  title: string;
  description: string;
  /** Live count or status line, e.g. "1,240 questions". */
  meta: string;
  cta: string;
  tone: string;
}

function plural(n: number, noun: string) {
  return `${n.toLocaleString('en-IN')} ${noun}${n === 1 ? '' : 's'}`;
}

// The six study resources as cards, each going straight to its own page. Counts are real
// (from the DB); a resource with nothing published yet says so instead of showing "0".
export function ResourceCards({
  board,
  counts,
}: {
  board: CbseBoard;
  counts: { subjects: number; chapters: number; mcqs: number; articles: number; mocks: number; samplePapers: number };
}) {
  const c = board.shortLabel;
  const resources: Resource[] = [
    {
      key: 'syllabus',
      icon: <ListChecks className="h-5 w-5" />,
      title: `${c} Syllabus`,
      description: 'Every subject and chapter for the current session, with the topics inside each chapter.',
      meta: `${plural(counts.subjects, 'subject')} · ${plural(counts.chapters, 'chapter')}`,
      cta: 'View syllabus',
      tone: 'bg-primary/10 text-primary',
    },
    {
      key: 'paper-pattern',
      icon: <FileText className="h-5 w-5" />,
      title: 'Paper Pattern',
      description: 'Sections, marks, question types and the theory–internal split for each subject.',
      meta: '3-hour papers · section-wise marks',
      cta: 'See paper pattern',
      tone: 'bg-secondary/10 text-secondary',
    },
    {
      key: 'practice',
      icon: <Target className="h-5 w-5" />,
      title: 'Practice MCQs',
      description: 'Subject and chapter-wise questions with worked solutions, plus a question of the day.',
      meta: counts.mcqs > 0 ? plural(counts.mcqs, 'question') : 'New questions being added',
      cta: 'Start practising',
      tone: 'bg-tertiary/10 text-tertiary',
    },
    {
      key: 'notes',
      icon: <BookOpen className="h-5 w-5" />,
      title: `${c} Notes`,
      description: 'Chapter notes, solved examples and quick revision guides mapped to the syllabus.',
      meta: counts.articles > 0 ? plural(counts.articles, 'note') : 'Notes coming soon',
      cta: 'Read notes',
      tone: 'bg-primary/10 text-primary',
    },
    {
      key: 'mock-tests',
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: 'Mock Tests',
      description: 'Timed board-style tests that show where marks slip away — or build your own.',
      meta: counts.mocks > 0 ? `${plural(counts.mocks, 'mock')} ready` : 'Build a custom mock',
      cta: 'Take a mock test',
      tone: 'bg-secondary/10 text-secondary',
    },
    {
      key: 'sample-papers',
      icon: <FileStack className="h-5 w-5" />,
      title: 'Sample Papers',
      description: 'Official CBSE sample question papers with marking schemes, to read online.',
      meta: counts.samplePapers > 0 ? plural(counts.samplePapers, 'paper') : 'Papers coming soon',
      cta: 'Open sample papers',
      tone: 'bg-tertiary/10 text-tertiary',
    },
  ];

  return (
    <LandingSection id="resources">
      <div className="max-w-2xl">
        <h2 className="text-headline-lg text-foreground">Everything for {board.label} in one place</h2>
        <p className="text-body-md mt-2 text-muted-foreground">Pick what you need today — each resource has its own page, organised subject by subject.</p>
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <li key={r.key}>
            <Link
              href={cbsePath(board.examSlug, r.key === 'overview' ? undefined : r.key)}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${r.tone}`}>{r.icon}</span>
                <span className="text-label-caps rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{r.meta}</span>
              </div>
              <h3 className="text-body-lg mt-5 font-semibold text-foreground">{r.title}</h3>
              <p className="text-body-sm mt-1.5 flex-1 text-muted-foreground">{r.description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {r.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
