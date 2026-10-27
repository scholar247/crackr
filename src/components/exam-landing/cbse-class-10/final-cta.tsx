import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function FinalCta({ practiceHref }: { practiceHref: string }) {
  return (
    <section className="bg-background pb-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-primary to-secondary p-8 text-primary-foreground sm:p-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-headline-lg">Start with one chapter today</h2>
            <p className="text-body-md mt-2 max-w-xl opacity-90">
              Pick the chapter you find hardest and solve ten questions. Small daily wins add up to a strong board result.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="secondary" className="rounded-full bg-background text-foreground hover:bg-background/90" asChild>
              <Link href={practiceHref}>Start practising</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <a href="#syllabus">Choose a chapter</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
