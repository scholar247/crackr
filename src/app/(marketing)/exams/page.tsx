import Link from 'next/link';
import type { Metadata } from 'next';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';

export const metadata: Metadata = { title: 'Exams' };
export const dynamic = 'force-dynamic';

export default async function ExamsPage() {
  const rows = await taxonomyRepository.listPublicExams();

  const byProgram = rows.reduce<Record<string, typeof rows>>((acc, row) => {
    (acc[row.programName] ??= []).push(row);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Exams</h1>
      <p className="mt-2 text-muted-foreground">Browse exams and their syllabus, grouped by program.</p>

      {Object.keys(byProgram).length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No exams published yet — check back soon.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {Object.entries(byProgram).map(([programName, examRows]) => (
            <div key={programName}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{programName}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {examRows.map(({ exam }) => (
                  <Link
                    key={exam.id}
                    href={`/exams/${exam.slug}`}
                    className="rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <h3 className="font-semibold text-foreground">{exam.name}</h3>
                    {exam.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{exam.description}</p>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
