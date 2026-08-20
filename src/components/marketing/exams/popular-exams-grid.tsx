'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ExamCardData } from '@/lib/exam-stats';

const PAGE_SIZE = 6;

// The array is already fully fetched+filtered+sorted server-side — this just reveals more
// of it locally, no refetch involved.
export function PopularExamsGrid({ exams }: { exams: ExamCardData[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = exams.slice(0, visible);

  return (
    <div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>

      {visible < exams.length && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="text-label-caps rounded-full border border-input px-6 py-2.5 uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
          >
            Load More Exams
          </button>
        </div>
      )}
    </div>
  );
}

function ExamCard({ exam }: { exam: ExamCardData }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-body-sm font-semibold text-background">
        {exam.initials}
      </div>

      <h3 className="text-body-lg mt-4 font-semibold text-foreground">{exam.name}</h3>
      {exam.description && <p className="text-body-sm mt-1 line-clamp-2 text-muted-foreground">{exam.description}</p>}

      <div className="mt-4 flex items-center gap-4">
        <Stat value={exam.subjectCount ? `${exam.subjectCount}` : '—'} label="Subjects" />
        <Stat value={exam.stats.mcqs} label="Practice" />
      </div>

      <Link
        href={`/exams/${exam.slug}`}
        className="text-label-caps mt-5 flex items-center justify-center rounded-full border border-input py-2.5 uppercase tracking-wide text-foreground transition-colors hover:bg-accent"
      >
        Explore Exam
      </Link>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-body-sm font-semibold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
