import Image from 'next/image';
import Link from 'next/link';
import { Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveDot } from '@/components/marketing/live-dot';

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-secondary/10 via-background to-background py-16">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <LiveDot />
            <span className="text-label-caps uppercase tracking-wider text-foreground">Adaptive Learning Engine Active</span>
          </div>

          <h1 className="text-display-lg mt-6 text-foreground">
            Practice.
            <br />
            <span className="text-gradient-brand">Improve.</span>
            <br />
            Master.
          </h1>

          <p className="text-body-lg mt-6 max-w-lg text-muted-foreground">
            Engage with targeted question sets designed to expose weaknesses and reinforce mastery. Precision practice
            for high-stakes exams.
          </p>

          <div className="mt-8">
            <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href="/exams">Start Practicing</Link>
            </Button>
          </div>

          <form
            action="/exams"
            method="GET"
            className="mt-6 flex max-w-md items-center gap-2 rounded-xl border border-border bg-card px-4 py-3"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              name="q"
              placeholder="Search for questions, topics, or past year papers…"
              className="text-body-sm w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="text-[10px] shrink-0 rounded border border-border px-1.5 py-0.5 text-muted-foreground">⌘K</kbd>
          </form>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-border shadow-2xl">
            <Image
              src="/practice_hero.png"
              alt="Adaptive practice analytics illustration"
              width={2764}
              height={1536}
              className="h-auto w-full"
              priority
            />
          </div>

          <div className="absolute -left-4 -top-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-body-sm font-medium text-foreground">Accuracy +5%</p>
          </div>
        </div>
      </div>
    </section>
  );
}
