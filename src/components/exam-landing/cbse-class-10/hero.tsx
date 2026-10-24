import Link from 'next/link';
import { format } from 'date-fns';
import { BookMarked, ChevronRight, FileQuestion, History, Layers, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Countdown } from '@/components/exam-landing/shared/countdown';
import { BOARD_EXAM, SESSION_LABEL, type RoadmapPhase } from './content';

interface HeroProps {
  examName: string;
  practiceHref: string;
  phase: RoadmapPhase;
  stats: { subjects: number; chapters: number; mcqs: number; pyqs: number };
}

export function CbseHero({ examName, practiceHref, phase, stats }: HeroProps) {
  const examDate = new Date(BOARD_EXAM.startsOn);
  const statItems = [
    { icon: <BookMarked className="h-4 w-4" />, value: stats.subjects, label: 'Subjects' },
    { icon: <Layers className="h-4 w-4" />, value: stats.chapters, label: 'Chapters' },
    { icon: <FileQuestion className="h-4 w-4" />, value: stats.mcqs.toLocaleString('en-IN'), label: 'Practice questions' },
    { icon: <History className="h-4 w-4" />, value: stats.pyqs.toLocaleString('en-IN'), label: 'Previous year Qs' },
  ];

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-page px-4 pt-8 sm:px-6 lg:px-8">
        <nav className="text-body-sm flex flex-wrap items-center gap-1.5 text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/exams" className="hover:text-foreground">
            Exams
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{examName}</span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-page gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:px-8 lg:py-14">
        <div>
          <span className="text-label-caps inline-flex items-center rounded-full border border-border bg-card px-4 py-2 uppercase text-secondary">
            CBSE · Class 10 · Session {SESSION_LABEL}
          </span>
          <h1 className="text-display-lg mt-6 text-foreground">CBSE Class 10 Board Exam Preparation</h1>
          <p className="text-body-lg mt-5 max-w-xl text-muted-foreground">
            The full Class 10 syllabus chapter by chapter, with practice questions, previous year questions and the exact paper pattern
            for Maths, Science, Social Science and English.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href={practiceHref}>Start practising</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <a href="#syllabus">Explore syllabus</a>
            </Button>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statItems.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">{s.icon}</div>
                <dd className="text-headline-md mt-3 text-foreground">{s.value}</dd>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <aside className="rounded-2xl bg-foreground p-6 text-background shadow-lg sm:p-8">
          <p className="text-label-caps uppercase tracking-wider opacity-70">Board exam countdown</p>
          <p className="text-headline-md mt-1">Main exam (Phase 1)</p>
          <div className="mt-5">
            <Countdown until={BOARD_EXAM.startsOn} />
          </div>
          <p className="text-body-sm mt-4 opacity-70">
            {BOARD_EXAM.isTentative ? 'Expected from ' : 'Starts '}
            {format(examDate, 'd MMMM yyyy')}
            {BOARD_EXAM.isTentative && ' · official date sheet awaited'}
          </p>

          <a
            href="#roadmap"
            className="mt-6 flex items-start gap-3 rounded-xl bg-background/10 p-4 transition-colors hover:bg-background/15"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <span className="text-label-caps block uppercase tracking-wider opacity-70">Where you should be now</span>
              <span className="mt-0.5 block font-semibold">{phase.title}</span>
              <span className="text-body-sm block opacity-70">{phase.focus[0]} → see the full plan</span>
            </span>
          </a>
        </aside>
      </div>
    </section>
  );
}
