import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';

export function NimcetFinalCta({ practiceHref }: { practiceHref: string }) {
  return (
    <section className="bg-background pb-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-2xl bg-foreground p-8 text-background sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-headline-lg">Start with one unit today</h2>
            <p className="text-body-md mt-2 opacity-75">
              Pick a study plan, finish the first unit, and practise its questions. Steady daily work across the syllabus matters more than any single
              long session.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="secondary" className="rounded-full" asChild>
              <Link href={`${NIMCET_PATH}/study-plan`}>Choose a study plan</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background" asChild>
              <Link href={practiceHref}>Practise questions</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
