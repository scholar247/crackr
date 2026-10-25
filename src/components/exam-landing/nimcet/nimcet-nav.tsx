import Link from 'next/link';
import { cn } from '@/lib/utils';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';

export const NIMCET_NAV = [
  { key: 'overview', label: 'Overview', href: NIMCET_PATH },
  { key: 'syllabus', label: 'Syllabus', href: `${NIMCET_PATH}/syllabus` },
  { key: 'exam-pattern', label: 'Exam pattern', href: `${NIMCET_PATH}/exam-pattern` },
  { key: 'eligibility', label: 'Eligibility', href: `${NIMCET_PATH}/eligibility` },
  { key: 'practice', label: 'Practice', href: `${NIMCET_PATH}/practice` },
  { key: 'mock-tests', label: 'Mock tests', href: `${NIMCET_PATH}/mock-tests` },
  { key: 'study-plan', label: 'Study plan', href: `${NIMCET_PATH}/study-plan` },
  { key: 'colleges', label: 'Colleges', href: `${NIMCET_PATH}/colleges` },
] as const;

export type NimcetNavKey = (typeof NIMCET_NAV)[number]['key'];

// The NIMCET section menu on every inner page: sticky under the site navbar, scrolling
// sideways on phones rather than wrapping.
export function NimcetNav({ current }: { current?: NimcetNavKey }) {
  return (
    <nav aria-label="NIMCET" className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-page gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
        {NIMCET_NAV.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={current === item.key ? 'page' : undefined}
            className={cn(
              'shrink-0 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              current === item.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
