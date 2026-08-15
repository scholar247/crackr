'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ExamCardData } from '@/lib/exam-stats';
import { EXAM_STATUS_BADGES, DEFAULT_EXAM_STATUS_BADGE, type ExamStatusBadge } from '@/lib/exam-stats';

const PAGE_SIZE = 6;

const BADGE_STYLES: Record<ExamStatusBadge, string> = {
  'Applications Open': 'border-secondary/30 bg-secondary/10 text-secondary',
  'Coming Soon': 'border-primary/30 bg-primary/10 text-primary',
  // Solid fill, not a tint: --destructive is a dark red in dark theme (meant to pair with
  // --destructive-foreground as a background, not sit as standalone text on a dark page),
  // so a text-destructive-on-tint reads as near-invisible in dark mode. The solid
  // fill+foreground pairing is guaranteed contrast in both themes.
  'Closing Soon': 'border-transparent bg-destructive text-destructive-foreground',
};

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
  const badge = EXAM_STATUS_BADGES[exam.slug] ?? DEFAULT_EXAM_STATUS_BADGE;

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-body-sm font-semibold text-background">
          {exam.initials}
        </div>
        <span className={cn('text-label-caps rounded-full border px-2.5 py-1 uppercase', BADGE_STYLES[badge])}>{badge}</span>
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
