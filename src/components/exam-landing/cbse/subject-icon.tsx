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
