import {
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  FileStack,
  FileText,
  House,
  ListChecks,
  Network,
  School,
  Target,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

// One icon and colour per exam section (CBSE and NIMCET keys), shared by the section bar,
// page headers and "continue" links so a section looks the same everywhere.

export const SECTION_ICONS: Record<string, LucideIcon> = {
  overview: House,
  syllabus: ListChecks,
  notes: BookOpen,
  'mind-maps': Network,
  practice: Target,
  'sample-papers': FileStack,
  'mock-tests': ClipboardCheck,
  'paper-pattern': FileText,
  'exam-pattern': FileText,
  eligibility: UserCheck,
  'study-plan': CalendarRange,
  colleges: School,
};

/** Gradient classes (written out in full for Tailwind). */
export const SECTION_GRADIENTS: Record<string, string> = {
  overview: 'from-primary to-violet-600',
  syllabus: 'from-indigo-500 to-blue-600',
  notes: 'from-teal-500 to-cyan-600',
  'mind-maps': 'from-violet-500 to-fuchsia-600',
  practice: 'from-emerald-500 to-teal-600',
  'sample-papers': 'from-sky-500 to-blue-600',
  'mock-tests': 'from-fuchsia-500 to-pink-600',
  'paper-pattern': 'from-amber-500 to-orange-600',
  'exam-pattern': 'from-amber-500 to-orange-600',
  eligibility: 'from-rose-500 to-pink-600',
  'study-plan': 'from-lime-500 to-green-600',
  colleges: 'from-cyan-500 to-sky-600',
};

export const sectionGradient = (key?: string) => (key && SECTION_GRADIENTS[key]) || 'from-primary to-violet-600';

/** Section heading style for inner pages: a small colour accent before the text. */
export const SECTION_HEADING =
  'text-headline-md relative pl-4 text-foreground before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-primary before:to-violet-500 max-sm:text-[1.35rem]';
