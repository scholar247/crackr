import Link from 'next/link';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveDot } from '@/components/marketing/live-dot';
import { PerformanceOverviewCard } from '@/components/marketing/home/performance-overview-card';

// Real, verifiable facts about the exams themselves — not platform usage stats — so this
// stays true regardless of how much content is seeded yet. See the audit note on
// performance-overview-card.tsx for why we stopped leading with invented usage numbers.
const STATS = [
  { value: '4', label: 'Exams: NIMCET, GATE-CSE, CUET-UG, CBSE' },
  { value: '30+', label: 'NITs via NIMCET alone' },
];

export function Hero() {
  return (
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
            <span className="text-label-caps uppercase tracking-wider text-foreground">Built by exam-crackers, not marketers</span>
          </div>

          <h1 className="text-headline-xl mt-6 tracking-tighter text-foreground lg:text-[64px] lg:leading-[72px]">
            Built by People Who&apos;ve <span className="text-gradient-brand">Actually Cracked These Exams</span>
          </h1>

          <p className="text-body-lg mt-6 max-w-xl leading-relaxed text-muted-foreground">
            We got tired of scattered PDFs and no way to tell if we were ready — so we built the structured theory,
            practice, and mock tests we wished we&apos;d had, hosted by us and by verified tutors.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href="/exams">Explore Exams</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href="/sign-in">Start Practicing</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-headline-md text-foreground">{stat.value}</p>
                <p className="text-body-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <PerformanceOverviewCard />
      </div>
    </section>
  );
}
