import Link from 'next/link';
import { ChevronRight, Clock, ListChecks, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AvatarStack } from '@/components/marketing/avatar-stack';
import { HeroGraphic } from './hero-graphic';

interface HeroExam {
  name: string;
  slug: string;
  description: string | null;
}

interface HeroProgram {
  name: string;
}

export function Hero({ exam, program }: { exam: HeroExam; program: HeroProgram | null }) {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-1.5 text-body-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/exams" className="hover:text-foreground">
            Exams
          </Link>
          {program && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span>{program.name}</span>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{exam.name}</span>
        </nav>
      </div>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-14">
        <div>
          <span className="text-label-caps inline-flex items-center rounded-full border border-border bg-card px-4 py-2 uppercase text-secondary">
            Entrance Examination
          </span>

          <h1 className="text-display-lg mt-6 text-foreground">{exam.name}</h1>
          {program && <p className="text-headline-md mt-1 text-secondary">{program.name}</p>}

          <p className="text-body-lg mt-6 max-w-xl text-muted-foreground">
            {exam.description ??
              `Master the ${exam.name} pattern with structured chapterwise practice, full-length mocks, and previous year papers mapped to the exact syllabus.`}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href={`/practice/exams/${exam.slug}/questions`}>Start Preparing</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href="?tab=subjects">View Syllabus</Link>
            </Button>
          </div>

          <div className="mt-6">
            <AvatarStack />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <StatChip icon={<Clock className="h-4 w-4" />} value="120" label="Minutes" />
            <StatChip icon={<ListChecks className="h-4 w-4" />} value="120" label="Questions" />
            <StatChip icon={<Trophy className="h-4 w-4" />} value="All India" label="Level" />
          </div>
        </div>

        <HeroGraphic examName={exam.name} />
      </section>
    </>
  );
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-4 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">{icon}</div>
      <p className="text-body-md font-semibold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
