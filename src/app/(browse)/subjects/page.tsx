import Link from 'next/link';
import { Metadata } from 'next';
import { serverGet } from '@/lib/server-fetch';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Hash, ChevronRight } from 'lucide-react';
import type { SubjectClient } from '@/types';

export const metadata: Metadata = {
  title: 'Browse Subjects',
  description: 'Practice MCQs by subject — Physics, Chemistry, Maths, Biology, and more.',
};

const SUBJECT_COLORS: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
  purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
  orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
  red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  yellow: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
  teal: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800',
  pink: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800',
};

const SUBJECT_TEXT_COLORS: Record<string, string> = {
  blue: 'text-blue-700 dark:text-blue-300',
  green: 'text-green-700 dark:text-green-300',
  purple: 'text-purple-700 dark:text-purple-300',
  orange: 'text-orange-700 dark:text-orange-300',
  red: 'text-red-700 dark:text-red-300',
  yellow: 'text-yellow-700 dark:text-yellow-300',
  teal: 'text-teal-700 dark:text-teal-300',
  pink: 'text-pink-700 dark:text-pink-300',
};

export default async function SubjectsPage() {
  const subjects = await serverGet<SubjectClient[]>('/api/public/subjects');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <BookOpen className="h-4 w-4" />
          <span>Browse by Subject</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Practice by Subject</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Choose a subject to explore topics and solve MCQs. No account required — start practising instantly.
        </p>
      </div>

      {/* Subject grid */}
      {subjects.length === 0 ? (
        <p className="text-muted-foreground">No subjects available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject) => {
            const colorClass = SUBJECT_COLORS[subject.color] ?? SUBJECT_COLORS.blue;
            const textColorClass = SUBJECT_TEXT_COLORS[subject.color] ?? SUBJECT_TEXT_COLORS.blue;
            return (
              <Link
                key={subject.id}
                href={`/subjects/${subject.slug}`}
                className={`group relative rounded-2xl border-2 p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 ${colorClass}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`text-3xl font-bold ${textColorClass}`}>
                    {subject.shortName ?? subject.name.slice(0, 2).toUpperCase()}
                  </div>
                  <ChevronRight className={`h-5 w-5 mt-1 transition-transform group-hover:translate-x-0.5 ${textColorClass} opacity-50`} />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">{subject.name}</h2>
                {subject.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{subject.description}</p>
                )}
                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    <span>{(subject.mcqCount ?? 0).toLocaleString()} questions</span>
                  </div>
                  {subject.topicCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {subject.topicCount} topics
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
