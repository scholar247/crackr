import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, CalendarClock, FileQuestion, FileStack, History, Layers, Network, Sparkles, Target } from 'lucide-react';
import { Breadcrumbs } from '@/components/exam-landing/shared/breadcrumbs';
import type { CbseBoard, RoadmapPhase } from '@/content/exams/cbse/types';
import { cbsePath } from './paths';
import { absoluteUrl } from './seo';
import { SharePageButton } from './share-page-button';

interface HeroProps {
  board: CbseBoard;
  practiceHref: string;
  phase: RoadmapPhase;
  stats: { subjects: number; chapters: number; mcqs: number; pyqs: number };
  mindMapCount: number;
  samplePaperCount: number;
  daysToExam: number | null;
  /** The notification board, shown in the right column so it's above the fold. */
  notifications: ReactNode;
}

// The first screen: what the page is (H1 + intro), a live countdown to the board exam, the
// two most useful actions and real numbers — with the notification board on the right
// (straight after the intro on phones). The backdrop is decorative only.
export function CbseHero({ board, practiceHref, phase, stats, mindMapCount, samplePaperCount, daysToExam, notifications }: HeroProps) {
  const slug = board.examSlug;
  const chips = [
    { icon: <Layers className="h-4 w-4" />, value: stats.chapters, label: 'chapters' },
    { icon: <FileQuestion className="h-4 w-4" />, value: stats.mcqs, label: 'practice questions' },
    { icon: <Network className="h-4 w-4" />, value: mindMapCount, label: 'mind maps' },
    { icon: <FileStack className="h-4 w-4" />, value: samplePaperCount, label: 'sample papers' },
    { icon: <History className="h-4 w-4" />, value: stats.pyqs, label: 'previous-year Qs' },
  ].filter((c) => c.value > 0); // never advertise a zero

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Decorative backdrop: soft colour glows and a fading dot grid. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="exam-float absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="exam-float-slow absolute top-10 right-[-6rem] h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="exam-float absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 [background-image:radial-gradient(color-mix(in_oklab,var(--foreground)_9%,transparent)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black_10%,transparent_75%)]" />
      </div>

      <div className="relative mx-auto max-w-page px-4 pt-5 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Exams', href: '/exams' }, { label: board.label }]} />
      </div>

      <div className="relative mx-auto grid max-w-page gap-8 px-4 pt-6 pb-10 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-12 lg:px-8 lg:pt-8 lg:pb-14">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-secondary uppercase backdrop-blur">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            CBSE · {board.shortLabel} · Session {board.session}
          </span>

          <h1 className="mt-4 text-[2.15rem] leading-[1.12] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
            {board.label} Board Exam{' '}
            <span className="bg-gradient-to-r from-primary via-violet-500 to-emerald-500 bg-clip-text text-transparent">Preparation</span>
          </h1>
          <p className="text-body-lg mt-4 max-w-xl text-muted-foreground">{board.heroDescription}</p>

          {/* Countdown + current phase */}
          {daysToExam !== null && (
            <div className="mt-6 flex flex-wrap items-stretch gap-3">
              <Link
                href={cbsePath(slug, 'sample-papers')}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-sm backdrop-blur transition hover:border-primary/40 hover:shadow-md"
              >
                <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-primary-foreground shadow">
                  <CalendarClock className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-2xl leading-none font-extrabold text-foreground tabular-nums">
                    {daysToExam}
                    <span className="ml-1.5 text-sm font-semibold text-muted-foreground">days to go</span>
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {board.boardExam.label}
                    {board.boardExam.isTentative ? ' (tentative)' : ''} · <span className="font-medium text-primary group-hover:underline">solve a sample paper</span>
                  </span>
                </span>
              </Link>
              <div className="hidden items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-3 sm:flex">
                <Sparkles className="h-5 w-5 text-amber-500" aria-hidden />
                <span className="text-xs text-muted-foreground">
                  Right now: <span className="block text-sm font-semibold text-foreground">{phase.title}</span>
                </span>
              </div>
            </div>
          )}

          {/* Main actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={practiceHref}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
            >
              <Target className="h-4 w-4" /> Start practising
            </Link>
            {mindMapCount > 0 ? (
              <Link
                href={`${cbsePath(slug)}#mind-maps`}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-primary/40 bg-card/80 px-5 text-sm font-semibold text-primary backdrop-blur transition hover:-translate-y-0.5 hover:bg-primary/10"
              >
                <Network className="h-4 w-4" /> Revise with mind maps
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">New</span>
              </Link>
            ) : (
              <Link href={cbsePath(slug, 'syllabus')} className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card/80 px-5 text-sm font-semibold text-foreground hover:border-primary/40">
                View syllabus <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <SharePageButton title={`${board.label} board exam preparation`} text={`Free ${board.label} syllabus, mind maps, MCQs and sample papers:`} url={absoluteUrl(cbsePath(slug))} />
          </div>

          {chips.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-2" aria-label="What's inside">
              {chips.map((c) => (
                <li key={c.label} className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-sm backdrop-blur">
                  <span className="text-secondary">{c.icon}</span>
                  <span className="font-bold text-foreground tabular-nums">{c.value.toLocaleString('en-IN')}</span>
                  <span className="text-muted-foreground">{c.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0 lg:row-span-2">{notifications}</div>
      </div>
    </section>
  );
}
