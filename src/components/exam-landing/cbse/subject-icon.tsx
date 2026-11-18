import { Atom, BookOpen, Briefcase, Calculator, Code, Dna, FlaskConical, Landmark, Languages, Microscope, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CbseSubjectKey } from '@/content/exams/cbse/types';

const ICONS: Record<CbseSubjectKey, LucideIcon> = {
  maths: Calculator,
  science: Microscope,
  'social-science': Landmark,
  english: Languages,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  economics: TrendingUp,
  'business-studies': Briefcase,
  'computer-science': Code,
};

/** Icon for a CBSE subject; a book for subjects without a mapped key. */
export function SubjectIcon({ subjectKey, className }: { subjectKey: CbseSubjectKey | null; className?: string }) {
  const Icon = (subjectKey && ICONS[subjectKey]) || BookOpen;
  return <Icon className={cn('h-4 w-4', className)} aria-hidden />;
}

/** A colour per subject, used for card headers and chips (class names written out for Tailwind). */
const TONES: Record<CbseSubjectKey, { gradient: string; soft: string }> = {
  maths: { gradient: 'from-blue-500 to-indigo-600', soft: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  science: { gradient: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  'social-science': { gradient: 'from-amber-500 to-orange-600', soft: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  english: { gradient: 'from-pink-500 to-rose-600', soft: 'bg-pink-500/10 text-pink-700 dark:text-pink-300' },
  physics: { gradient: 'from-sky-500 to-blue-600', soft: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  chemistry: { gradient: 'from-violet-500 to-purple-600', soft: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  biology: { gradient: 'from-green-500 to-emerald-600', soft: 'bg-green-500/10 text-green-700 dark:text-green-300' },
  economics: { gradient: 'from-orange-500 to-red-500', soft: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
  'business-studies': { gradient: 'from-cyan-500 to-sky-600', soft: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' },
  'computer-science': { gradient: 'from-slate-600 to-slate-800', soft: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' },
};
const DEFAULT_TONE = { gradient: 'from-primary to-violet-600', soft: 'bg-primary/10 text-primary' };

export function subjectTone(subjectKey: CbseSubjectKey | null) {
  return (subjectKey && TONES[subjectKey]) || DEFAULT_TONE;
}
