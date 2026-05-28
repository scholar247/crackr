import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { serverGet } from '@/lib/server-fetch';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ScrollText, Hash, Calendar } from 'lucide-react';
import type { ExamClient, PYPClient } from '@/types';

interface Props { params: Promise<{ examSlug: string }> }

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { examSlug } = await params;
  try {
    const data = await serverGet<{ exam: ExamClient }>(`/api/public/exams/${examSlug}`);
    return {
      title: `${data.exam.name} Previous Year Papers`,
      description: `Solve previous year papers for ${data.exam.name}. Practice with real exam questions.`,
    };
  } catch {
    return { title: 'Previous Year Papers' };
  }
}

export default async function ExamPYPListPage({ params }: Props) {
  const { examSlug } = await params;

  const [data, pyps] = await Promise.all([
    serverGet<{ exam: ExamClient }>(`/api/public/exams/${examSlug}`).catch(() => null),
    serverGet<PYPClient[]>(`/api/public/pyp?examSlug=${examSlug}`).catch(() => [] as PYPClient[]),
  ]);

  if (!data?.exam) notFound();

  const exam = data.exam;

  // Group PYPs by year
  const byYear = pyps.reduce<Record<number, PYPClient[]>>((acc, pyp) => {
    if (!acc[pyp.year]) acc[pyp.year] = [];
    acc[pyp.year].push(pyp);
    return acc;
  }, {});

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/pyp" className="hover:text-foreground transition-colors">PYP</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{exam.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight">{exam.name}</h1>
          {exam.isFeatured && <Badge variant="secondary">Popular</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{exam.conductedBy}</p>
        {exam.description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{exam.description}</p>
        )}
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <ScrollText className="h-4 w-4" />
          <span>{pyps.length} paper{pyps.length !== 1 ? 's' : ''} available</span>
        </div>
      </div>

      {/* PYP list grouped by year */}
      {years.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No papers available yet</p>
          <p className="text-sm mt-1">Check back soon — papers are being added regularly.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year) => (
            <section key={year}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {year}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {byYear[year]
                  .sort((a, b) => b.month - a.month)
                  .map((pyp) => (
                    <Link
                      key={pyp.id}
                      href={`/pyp/${examSlug}/${pyp.slug}`}
                      className="group rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {MONTH_NAMES[pyp.month]}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pyp.title}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        <span>{pyp.mcqCount} question{pyp.mcqCount !== 1 ? 's' : ''}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
