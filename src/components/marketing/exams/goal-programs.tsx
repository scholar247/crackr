import Link from 'next/link';
import { Cpu, HeartPulse, Landmark, BookOpen, type LucideIcon } from 'lucide-react';

interface Program {
  id: string;
  slug: string;
  name: string;
}

interface GoalProgramsProps {
  programs: Program[];
  examNamesByProgram: Record<string, string[]>;
}

function getProgramIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes('medical')) return HeartPulse;
  if (n.includes('engineering')) return Cpu;
  if (n.includes('cuet') || n.includes('board')) return Landmark;
  return BookOpen;
}

export function GoalPrograms({ programs, examNamesByProgram }: GoalProgramsProps) {
  if (programs.length === 0) return null;

  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-headline-lg text-foreground">What&apos;s Your Goal?</h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((program) => {
            const Icon = getProgramIcon(program.name);
            const examNames = examNamesByProgram[program.name] ?? [];
            return (
              <Link
                key={program.id}
                href={`/exams?program=${program.slug}`}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-body-md mt-2 font-semibold text-foreground">{program.name.replace(/ Exams$/, '')}</p>
                {examNames.length > 0 && <p className="text-body-sm text-muted-foreground">{examNames.join(', ')}</p>}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
