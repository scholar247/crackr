import Link from 'next/link';
import { Metadata } from 'next';
import { serverGet } from '@/lib/server-fetch';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, ChevronRight, ScrollText } from 'lucide-react';
import type { ExamCategory, ExamClient } from '@/types';

export const metadata: Metadata = {
  title: 'Previous Year Papers',
  description: 'Solve previous year exam questions for JEE, NEET, NIMCET, UPSC and more — free, no login required.',
  alternates: { canonical: '/pyp' },
};

const CATEGORY_ORDER: ExamCategory[] = [
  'ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'BANKING', 'GOVERNMENT', 'SCHOOL', 'OTHER',
];

const CATEGORY_LABELS: Record<ExamCategory, string> = {
  ENGINEERING: 'Engineering Entrance',
  MEDICAL: 'Medical Entrance',
  MANAGEMENT: 'Management',
  BANKING: 'Banking & Finance',
  GOVERNMENT: 'Government & Civil Services',
  SCHOOL: 'School / Board',
  OTHER: 'Other',
};

const CATEGORY_COLORS: Record<ExamCategory, string> = {
  ENGINEERING: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900',
  MEDICAL: 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900',
  MANAGEMENT: 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900',
  BANKING: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900',
  GOVERNMENT: 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900',
  SCHOOL: 'bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900',
  OTHER: 'bg-muted/40 border-border',
};

export default async function PYPHomePage() {
  const exams = await serverGet<ExamClient[]>('/api/public/exams?active=true');

  const byCategory = exams.reduce<Partial<Record<ExamCategory, typeof exams>>>((acc, exam) => {
    const cat = (exam.category as ExamCategory) ?? 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(exam);
    return acc;
  }, {});

  const activeCategories = CATEGORY_ORDER.filter((c) => (byCategory[c]?.length ?? 0) > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <ScrollText className="h-4 w-4" />
          <span>Previous Year Papers</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">PYP Practice</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Practise with actual questions from previous exams. Pick your exam to explore year-wise papers.
        </p>
      </div>

      <div className="space-y-12">
        {activeCategories.map((category) => (
          <section key={category}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {byCategory[category]!.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/pyp/${exam.slug}`}
                  className={`group relative rounded-2xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${CATEGORY_COLORS[category]}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-foreground">{exam.name}</h3>
                        {exam.isFeatured && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{exam.conductedBy}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  {exam.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{exam.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ScrollText className="h-3 w-3" />
                    <span>View papers</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {activeCategories.length === 0 && (
          <p className="text-muted-foreground">No exams available yet.</p>
        )}
      </div>
    </div>
  );
}
