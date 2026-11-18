import Link from 'next/link';
import { ArrowRight, Brain, Layers, Network, Share2, Sparkles } from 'lucide-react';
import { LandingSection } from '@/components/exam-landing/shared/section-header';
import type { CbseBoard, CbseSubjectKey } from '@/content/exams/cbse/types';
import { cbsePath } from './paths';
import { SubjectIcon, subjectTone } from './subject-icon';
import { ContinueRevising } from './continue-revising';

export interface FeaturedMindMap {
  chapterId: string;
  chapter: string;
  subject: string;
  subjectKey: CbseSubjectKey | null;
  href: string;
  topics: number;
}

const FEATURES = [
  { icon: <Network className="h-4 w-4" />, title: 'Tap to explore', text: 'Open one topic at a time — no clutter.' },
  { icon: <Brain className="h-4 w-4" />, title: 'Quiz me', text: 'Hide the points and test your recall.' },
  { icon: <Layers className="h-4 w-4" />, title: 'Flashcards & tests', text: 'Spaced repetition that sticks.' },
  { icon: <Share2 className="h-4 w-4" />, title: 'Share with friends', text: 'Send any map to your study group.' },
];

// The mind-maps showcase: a bold pitch with a living mini map, the student's own "continue"
// row, then chapter cards that open each map directly.
export function MindMapSpotlight({ board, maps }: { board: CbseBoard; maps: FeaturedMindMap[] }) {
  if (maps.length === 0) return null;
  const slug = board.examSlug;
  const first = maps[0];

  return (
    <LandingSection id="mind-maps" muted>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-2xl shadow-violet-500/20 sm:p-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.12)_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> New · Interactive mind maps
            </span>
            <h2 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">Revise any {board.shortLabel} chapter in 5 minutes</h2>
            <p className="mt-3 max-w-lg text-white/85">
              {maps.length} chapter{maps.length === 1 ? '' : 's'} mapped topic by topic — see how everything connects, then lock it in.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">{f.icon}</span>
                  <span>
                    <span className="block text-sm font-semibold">{f.title}</span>
                    <span className="block text-xs text-white/75">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={cbsePath(slug, 'mind-maps')} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                Browse all mind maps <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`${first.href}#mind-map`} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                Try {first.chapter}
              </Link>
            </div>
          </div>

          {/* A tiny living mind map (decorative) */}
          <div aria-hidden className="relative mx-auto hidden aspect-[4/3] w-full max-w-md sm:block">
            <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" fill="none" strokeLinecap="round">
              {[
                ['M200 150 C 150 150, 140 70, 90 70', '#fde68a'],
                ['M200 150 C 150 150, 140 230, 90 230', '#a7f3d0'],
                ['M200 150 C 250 150, 260 60, 310 60', '#bfdbfe'],
                ['M200 150 C 250 150, 260 150, 315 150', '#fbcfe8'],
                ['M200 150 C 250 150, 260 240, 310 240', '#ddd6fe'],
              ].map(([d, c]) => (
                <path key={d} d={d} stroke={c} strokeWidth="3.5" pathLength={1} className="mm-draw" />
              ))}
            </svg>
            <div className="absolute top-1/2 left-1/2 flex h-16 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white text-center text-sm font-bold text-indigo-700 shadow-xl">{board.shortLabel}</div>
            {/* Real chapters with maps, floating around the class. */}
            {(['left-[0%] top-[17%]', 'left-[0%] top-[71%]', 'right-[0%] top-[13%]', 'right-[0%] top-[44%]', 'right-[0%] top-[74%]'] as const).map((pos, i) =>
              maps[i] ? (
                <span
                  key={pos}
                  className={`exam-pop absolute ${pos} max-w-[9.5rem] truncate rounded-xl border border-white/40 bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur`}
                  style={{ animationDelay: `${i * 0.35}s` }}
                >
                  {maps[i].chapter}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ContinueRevising examSlug={slug} chapters={maps.map(({ chapterId, chapter, subject, href }) => ({ chapterId, chapter, subject, href }))} />
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">Popular chapter mind maps</h3>
          <Link href={cbsePath(slug, 'mind-maps')} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {maps.slice(0, 8).map((m) => {
            const tone = subjectTone(m.subjectKey);
            return (
              <li key={m.chapterId} className="min-w-0">
                <Link
                  href={`${m.href}#mind-map`}
                  className="group flex h-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone.gradient} text-white shadow`}>
                    <SubjectIcon subjectKey={m.subjectKey} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">{m.chapter}</span>
                    <span className="block text-xs text-muted-foreground">
                      {m.subject}
                      {m.topics > 0 ? ` · ${m.topics} topics` : ''}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </LandingSection>
  );
}
