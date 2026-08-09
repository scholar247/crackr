import Link from 'next/link';
import type { Metadata } from 'next';
import { Terminal, GraduationCap, HeartPulse, Landmark, BookOpen, Flame, ArrowRight, Trophy, Microscope, TimerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizPreviewCard } from '@/components/marketing/quiz-preview-card';
import { LiveDot } from '@/components/marketing/live-dot';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';

export const metadata: Metadata = {
  title: 'scholar247 — Learn, Practice, Progress, Crack Exams',
  description:
    'The smartest way to prepare for competitive exams. Practice curated question banks, follow structured curricula, and track your progress.',
};

export const dynamic = 'force-dynamic';

const PROGRAM_ICONS: Record<string, typeof BookOpen> = {
  'pg-engineering-exams': Terminal,
  'ug-engineering-exams': GraduationCap,
  'ug-medical-exams': HeartPulse,
  'ug-cuet-board-exams': Landmark,
};

// Cycled per card — primary/secondary/tertiary accent rotation, matching the
// generated design's per-card color treatment.
const CARD_TINTS = [
  { icon: 'text-primary bg-primary/20', blob: 'bg-primary/10 group-hover:bg-primary/15' },
  { icon: 'text-secondary bg-secondary/20', blob: 'bg-secondary/10 group-hover:bg-secondary/15' },
  { icon: 'text-tertiary bg-tertiary/20', blob: 'bg-tertiary/10 group-hover:bg-tertiary/15' },
];

// Illustrative — mock/MCQ volume isn't tracked per program yet, only the exam
// list below is real.
const PROGRAM_STATS: Record<string, { mocks: string; mcqs: string }> = {
  'pg-engineering-exams': { mocks: '150+ Mocks', mcqs: '10K+ MCQs' },
  'ug-engineering-exams': { mocks: '200+ Mocks', mcqs: '15K+ MCQs' },
  'ug-medical-exams': { mocks: '180+ Mocks', mcqs: '12K+ MCQs' },
  'ug-cuet-board-exams': { mocks: '120+ Mocks', mcqs: '8K+ MCQs' },
};

const FEATURES = [
  {
    icon: Trophy,
    tint: 'primary' as const,
    title: 'Real-time Percentile Leaderboards',
    description:
      'See exactly where you stand against thousands of live test takers. Our dynamic percentiles adjust in real-time as data streams in.',
  },
  {
    icon: Microscope,
    tint: 'secondary' as const,
    title: 'AI Weak Spot Diagnostic',
    description:
      'Stop guessing. Our engine maps your incorrect answers to specific micro-concepts, generating a custom remedial syllabus just for you.',
  },
  {
    icon: TimerOff,
    tint: 'primary' as const,
    title: 'Official Pattern Negative Marking',
    description:
      'Condition your risk appetite. Our test engine strictly mimics the official marking schemes, penalizing blind guesses precisely.',
  },
];

export default async function HomePage() {
  const [programs, examRows] = await Promise.all([
    taxonomyRepository.listPublicPrograms(),
    taxonomyRepository.listPublicExams(),
  ]);

  const examNamesByProgram = examRows.reduce<Record<string, string[]>>((acc, { exam, programName }) => {
    (acc[programName] ??= []).push(exam.name);
    return acc;
  }, {});

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-20" aria-hidden="true">
          <div className="absolute right-1/4 top-0 h-[800px] w-[800px] animate-pulse rounded-full bg-primary/20 blur-[120px]" />
          <div
            className="absolute bottom-0 left-1/3 h-[600px] w-[600px] animate-pulse rounded-full bg-secondary/15 blur-[100px]"
            style={{ animationDelay: '2s' }}
          />
        </div>

        <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-container-high/60 px-4 py-2 backdrop-blur-md">
              <Flame className="h-4 w-4 text-secondary" />
              <LiveDot />
              <span className="text-label-caps uppercase tracking-wider text-foreground">
                1,240 aspirants practicing right now
              </span>
            </div>

            <h1 className="text-headline-xl mt-6 tracking-tighter text-foreground lg:text-[64px] lg:leading-[72px]">
              Crack Competitive Exams with <span className="text-gradient-brand">AI Analytics</span>
            </h1>

            <p className="text-body-lg mt-6 max-w-xl leading-relaxed text-muted-foreground">
              Master the exam pattern before the exam day. Experience real-time negative marking, percentile rankings, and
              AI-driven weak spot diagnostics designed for top rankers.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
                <Link href="/sign-in">Start Free Practice</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
                <Link href="/exams">Explore All Exams</Link>
              </Button>
            </div>
          </div>

          <QuizPreviewCard
            eyebrow="Mathematics"
            timer="01:30 Timed"
            timedBadge
            question="If f(x) = ∫₀ˣ t·sin(t) dt, then the value of f′(π/2) is:"
            correctKey="B"
            options={[
              { key: 'A', text: 'π' },
              { key: 'B', text: 'π/2' },
              { key: 'C', text: '0' },
              { key: 'D', text: '-π/2' },
            ]}
            solution="Using Leibniz's rule for differentiation under the integral sign: f′(x) = x·sin(x). Substituting x = π/2, we get f′(π/2) = (π/2)·sin(π/2) = π/2 × 1 = π/2."
          />
        </div>
      </section>

      <section className="relative z-10 bg-surface-container-lowest py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-headline-lg text-foreground">Targeted Exam Programs</h2>
              <p className="text-body-md mt-1 text-muted-foreground">Curated test series matching official syllabus weights.</p>
            </div>
            <Link
              href="/exams"
              className="text-label-caps hidden shrink-0 items-center gap-1.5 uppercase tracking-wider text-primary transition-colors hover:text-primary/80 sm:flex"
            >
              View Catalog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {programs.length === 0 ? (
            <p className="text-body-sm mt-10 text-muted-foreground">Programs coming soon.</p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {programs.map((program, i) => {
                const Icon = PROGRAM_ICONS[program.slug] ?? BookOpen;
                const stats = PROGRAM_STATS[program.slug];
                const examNames = examNamesByProgram[program.name] ?? [];
                const tint = CARD_TINTS[i % CARD_TINTS.length];
                return (
                  <Link
                    key={program.id}
                    href="/exams"
                    className="group relative block overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:bg-accent hover:shadow-xl"
                  >
                    <div
                      className={`absolute -right-0 -top-0 h-32 w-32 rounded-bl-full transition-transform group-hover:scale-110 ${tint.blob}`}
                      aria-hidden="true"
                    />

                    <div className={`relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl shadow-inner ${tint.icon}`}>
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="text-headline-md relative mb-1 text-foreground">{program.name.replace(/ Exams$/, '')}</h3>

                    {examNames.length > 0 && (
                      <p className="text-body-md relative mb-4 text-muted-foreground">{examNames.join(', ')}</p>
                    )}

                    {stats && (
                      <div className="relative flex items-center gap-3">
                        <span className="rounded bg-background px-2 py-1 text-[10px] font-medium uppercase text-muted-foreground">
                          {stats.mocks}
                        </span>
                        <span className="rounded bg-background px-2 py-1 text-[10px] font-medium uppercase text-muted-foreground">
                          {stats.mcqs}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="w-full bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-headline-lg text-foreground">The 247 Advantage</h2>
            <p className="text-body-md mx-auto mt-2 max-w-2xl text-muted-foreground">
              Built on cognitive science principles to maximize retention and identify test-taking blind spots before they
              cost you marks.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, tint, title, description }, i) => (
              <div
                key={title}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-muted/50 p-6 transition-all duration-500 hover:shadow-xl ${i === 1 ? 'md:-mt-8' : ''}`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                    tint === 'primary' ? 'from-primary/10' : 'from-secondary/10'
                  } via-transparent to-transparent`}
                  aria-hidden="true"
                />
                <div
                  className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent transition-all duration-500 ${
                    tint === 'primary' ? 'via-primary/50 group-hover:via-primary' : 'via-secondary/50 group-hover:via-secondary'
                  }`}
                  aria-hidden="true"
                />

                <div
                  className={`relative mb-4 flex h-14 w-14 items-center justify-center rounded-full border bg-card ${
                    tint === 'primary' ? 'border-primary/30 text-primary' : 'border-secondary/30 text-secondary'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-headline-md relative mb-2 text-foreground">{title}</h3>
                <p className="text-body-md relative leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
