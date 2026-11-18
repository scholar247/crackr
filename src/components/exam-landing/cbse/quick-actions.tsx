import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, ClipboardCheck, FileStack, FileText, Flame, ListChecks, Network, Target } from 'lucide-react';
import { LandingSection } from '@/components/exam-landing/shared/section-header';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { cbsePath } from './paths';

interface Tile {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  meta: string;
  gradient: string;
  badge?: string;
}

const plural = (n: number, noun: string) => `${n.toLocaleString('en-IN')} ${noun}${n === 1 ? '' : 's'}`;

// "Jump right in": every study tool as a big, tappable tile that deep-links to the exact
// place it lives (e.g. the daily question on the practice page). Counts are live; empty
// tools say what's coming instead of showing a zero.
export function QuickActions({
  board,
  counts,
}: {
  board: CbseBoard;
  counts: { subjects: number; chapters: number; mcqs: number; articles: number; mocks: number; samplePapers: number; mindMaps: number };
}) {
  const slug = board.examSlug;
  const c = board.shortLabel;
  const tiles: Tile[] = [
    {
      href: `${cbsePath(slug, 'practice')}#daily`,
      icon: <Flame className="h-5 w-5" />,
      title: 'Question of the day',
      description: 'One new question every day — answer it to keep your streak alive.',
      meta: 'Build your streak',
      gradient: 'from-orange-500 to-rose-500',
    },
    {
      href: cbsePath(slug, 'mind-maps'),
      icon: <Network className="h-5 w-5" />,
      title: `${c} Mind Maps`,
      description: 'Interactive chapter maps with quizzes and flashcards for fast revision.',
      meta: counts.mindMaps > 0 ? plural(counts.mindMaps, 'chapter') : 'Coming soon',
      gradient: 'from-violet-500 to-indigo-600',
      badge: counts.mindMaps > 0 ? 'New' : undefined,
    },
    {
      href: `${cbsePath(slug, 'practice')}#find`,
      icon: <Target className="h-5 w-5" />,
      title: 'Practice MCQs',
      description: 'Pick a subject, chapter and topic, then practise with worked solutions.',
      meta: counts.mcqs > 0 ? plural(counts.mcqs, 'question') : 'New questions being added',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      href: cbsePath(slug, 'sample-papers'),
      icon: <FileStack className="h-5 w-5" />,
      title: 'Sample Papers',
      description: 'Official CBSE sample papers with marking schemes, to read online.',
      meta: counts.samplePapers > 0 ? plural(counts.samplePapers, 'paper') : 'Coming soon',
      gradient: 'from-sky-500 to-blue-600',
    },
    {
      href: cbsePath(slug, 'mock-tests'),
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: 'Mock Tests',
      description: 'Timed board-style tests that show where marks slip away.',
      meta: counts.mocks > 0 ? `${plural(counts.mocks, 'mock')} ready` : 'Build a custom mock',
      gradient: 'from-fuchsia-500 to-pink-600',
    },
    {
      href: cbsePath(slug, 'syllabus'),
      icon: <ListChecks className="h-5 w-5" />,
      title: `${c} Syllabus`,
      description: 'Every subject, chapter and topic for this session.',
      meta: `${plural(counts.subjects, 'subject')} · ${plural(counts.chapters, 'chapter')}`,
      gradient: 'from-primary to-violet-600',
    },
    {
      href: cbsePath(slug, 'paper-pattern'),
      icon: <FileText className="h-5 w-5" />,
      title: 'Paper Pattern',
      description: 'Sections, marks and question types for each subject.',
      meta: 'Section-wise marks',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      href: cbsePath(slug, 'notes'),
      icon: <BookOpen className="h-5 w-5" />,
      title: `${c} Notes`,
      description: 'Chapter notes, solved examples and quick revision guides.',
      meta: counts.articles > 0 ? plural(counts.articles, 'note') : 'Notes coming soon',
      gradient: 'from-teal-500 to-cyan-600',
    },
  ];

  return (
    <LandingSection id="resources">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-label-caps tracking-wider text-primary uppercase">Jump right in</p>
          <h2 className="text-headline-lg mt-1 text-foreground max-sm:text-2xl">Everything for {board.label} in one place</h2>
          <p className="text-body-md mt-2 text-muted-foreground">Pick what you need today — every tile opens exactly where you start.</p>
        </div>
      </div>
      <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.title}>
            <Link
              href={t.href}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none sm:p-5"
            >
              {/* Hover glow in the tile's colour */}
              <span aria-hidden className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br ${t.gradient} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-25`} />
              <div className="flex items-start justify-between gap-2">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${t.gradient} text-white shadow-md transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3`}>{t.icon}</span>
                {t.badge && <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">{t.badge}</span>}
              </div>
              <h3 className="mt-3.5 text-[15px] leading-snug font-semibold text-foreground sm:text-base">{t.title}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground sm:text-sm">{t.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                {t.meta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
