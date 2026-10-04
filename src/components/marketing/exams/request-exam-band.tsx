import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Closes the page for visitors who didn't find their exam — the most useful signal we can
// collect from this page — instead of a generic sign-up pitch.
export function RequestExamBand() {
  return (
    <section className="pb-16 lg:pb-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-secondary/10 to-tertiary/10 px-6 py-12 text-center sm:px-12">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-headline-lg text-foreground">Can&apos;t find your exam?</h2>
            <p className="text-body-md mt-3 text-muted-foreground">
              Tell us which exam you&apos;re preparing for and we&apos;ll prioritise adding its syllabus, practice and mocks.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
                <Link href="/contact">Request an exam</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-label-caps rounded-full bg-background/60 uppercase tracking-wider backdrop-blur-sm"
                asChild
              >
                <Link href="/practice">Try practice first</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
