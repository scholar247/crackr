import Link from 'next/link';
import type { ReactNode } from 'react';
import { BookMarked, FileQuestion, History, Layers, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/exam-landing/shared/breadcrumbs';
import type { CbseBoard, RoadmapPhase } from '@/content/exams/cbse/types';
import { cbsePath } from './paths';

interface HeroProps {
  board: CbseBoard;
  practiceHref: string;
  phase: RoadmapPhase;
  stats: { subjects: number; chapters: number; mcqs: number; pyqs: number };
  /** The notification board, shown in the right column so it's above the fold. */
  notifications: ReactNode;
}

// Left: what this page is (H1, intro, CTAs), then the countdown and stats. Right: the
// notification board. On phones the board comes straight after the intro and CTAs.
export function CbseHero({ board, practiceHref, phase, stats, notifications }: HeroProps) {
  const examDate = new Date(board.boardExam.startsOn);
  const statItems = [
    { icon: <BookMarked className="h-4 w-4" />, value: stats.subjects, label: 'Subjects' },
    { icon: <Layers className="h-4 w-4" />, value: stats.chapters, label: 'Chapters' },
    { icon: <FileQuestion className="h-4 w-4" />, value: stats.mcqs.toLocaleString('en-IN'), label: 'Practice questions' },
    { icon: <History className="h-4 w-4" />, value: stats.pyqs.toLocaleString('en-IN'), label: 'Previous year Qs' },
  ];

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-page px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Exams', href: '/exams' }, { label: board.label }]} />
      </div>

      <div className="mx-auto grid max-w-page gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-10 lg:px-8 lg:py-10">
        <div>
          <span className="text-label-caps inline-flex items-center rounded-full border border-border bg-card px-4 py-2 uppercase text-secondary">
            CBSE · {board.shortLabel} · Session {board.session}
          </span>
          <h1 className="text-display-lg mt-5 text-foreground max-sm:text-[2.25rem] max-sm:leading-[2.75rem]">{board.label} Board Exam Preparation</h1>
          <p className="text-body-lg mt-4 max-w-xl text-muted-foreground">{board.heroDescription}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href={practiceHref}>Start practising</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href={cbsePath(board.examSlug, 'syllabus')}>View syllabus</Link>
            </Button>
          </div>
        </div>

        <div className="lg:row-span-2">{notifications}</div>

        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statItems.map((s) => (
              <div key={s.label} className="flex flex-col rounded-xl border border-border bg-card p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">{s.icon}</div>
                <dt className="order-last text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</dt>
                <dd className="text-headline-md mt-3 text-foreground">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
