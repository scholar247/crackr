import Link from 'next/link';
import { Cpu, HeartPulse, Landmark, BookOpen, type LucideIcon } from 'lucide-react';

interface Program {
  id: string;
  slug: string;
  name: string;
}

interface ProgramBrowseProps {
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

// Replaces the old keyword-guessed "category" chips — programs are a real taxonomy
// entity (not a synthetic label), so browsing by program both means something and stays
// in sync with the actual data instead of a hand-maintained keyword list.
export function ProgramBrowse({ programs, examNamesByProgram }: ProgramBrowseProps) {
  if (programs.length === 0) return null;

  return (
    <section id="browse-by-program" className="bg-muted/40 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-headline-lg text-foreground">Browse by Program</h2>
        <p className="text-body-md mt-1 text-muted-foreground">Explore exams grouped by the programs they lead to.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((program) => {
            const Icon = getProgramIcon(program.name);
            const examNames = examNamesByProgram[program.name] ?? [];
            return (
              <Link
                key={program.id}
                href={`/exams?program=${program.slug}`}
                className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                {/* Corner accent — a soft glow tucked into the top-right corner that blooms on hover */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:scale-125 group-hover:bg-primary/25"
                />

                <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-body-md relative z-10 mt-2 font-semibold text-foreground">{program.name.replace(/ Exams$/, '')}</p>
                {examNames.length > 0 && (
                  <p className="text-body-sm relative z-10 line-clamp-2 text-muted-foreground">{examNames.join(', ')}</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
