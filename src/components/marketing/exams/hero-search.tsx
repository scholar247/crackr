import Link from 'next/link';
import { Search } from 'lucide-react';
import { SITE_NAME } from '@/lib/site-config';

interface HeroSearchProps {
  q?: string;
  trending: string[];
}

// A plain GET form — submitting re-renders /exams?q=... server-side, no client JS needed.
export function HeroSearch({ q, trending }: HeroSearchProps) {
  return (
    <section className="bg-gradient-to-b from-secondary/10 via-background to-background py-16">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="text-label-caps uppercase tracking-wider text-secondary">{SITE_NAME} Exams Directory</span>
        <h1 className="text-headline-xl mt-3 text-foreground">
          Find Your <span className="text-gradient-brand">Exam</span>
        </h1>
        <p className="text-body-lg mx-auto mt-4 max-w-xl text-muted-foreground">
          Navigate through India&apos;s top competitive exams. Access detailed syllabus, practice sets, and mock tests
          tailored for your success.
        </p>

        <form action="/exams" method="GET" className="mt-8 flex items-center gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
          <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search exams by name, category, or goal..."
            className="text-body-sm w-full bg-transparent px-1 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            className="text-label-caps shrink-0 rounded-xl bg-foreground px-6 py-2.5 uppercase tracking-wider text-background transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </form>

        {trending.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-body-sm text-muted-foreground">Trending:</span>
            {trending.map((name) => (
              <Link
                key={name}
                href={`/exams?q=${encodeURIComponent(name)}`}
                className="text-label-caps rounded-full border border-border bg-card px-3 py-1 uppercase text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
