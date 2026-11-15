import type { ReactNode } from 'react';
import type { Crumb } from '@/components/exam-landing/shared/breadcrumbs';
import { ExamNav, ExamPageShell } from '@/components/exam-landing/shared/exam-page-shell';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { cbseNavItems, cbsePath, cbseSteps, type CbseNavKey } from './paths';

/** The CBSE section menu (Overview, Syllabus, Paper pattern…) for one class. */
export function CbseNav({ board, current }: { board: CbseBoard; current?: CbseNavKey }) {
  return <ExamNav label={`${board.label} sections`} items={cbseNavItems(board.examSlug)} current={current} />;
}

// Frame for every CBSE inner page. `next` lists the sections to suggest at the bottom —
// defaults to every section except the current one, so each page links to all its siblings.
export function CbsePageShell({
  board,
  current,
  crumbs = [],
  next,
  ...rest
}: {
  board: CbseBoard;
  current: CbseNavKey;
  /** Crumbs after Home › Exams › CBSE Class N › <current section>. */
  crumbs?: Crumb[];
  next?: CbseNavKey[];
  eyebrow?: string;
  title: string;
  intro: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const steps = cbseSteps(board);
  const sectionLabel = cbseNavItems(board.examSlug).find((i) => i.key === current)?.label ?? '';
  const nextKeys = next ?? (Object.keys(steps) as CbseNavKey[]).filter((k) => k !== current && k !== 'overview');

  return (
    <ExamPageShell
      {...rest}
      nav={<CbseNav board={board} current={current} />}
      crumbs={[
        { label: 'Home', href: '/' },
        { label: 'Exams', href: '/exams' },
        { label: board.label, href: cbsePath(board.examSlug) },
        ...(crumbs.length ? [{ label: sectionLabel, href: steps[current].href }, ...crumbs] : [{ label: sectionLabel }]),
      ]}
      nextStepsTitle={`Continue your ${board.shortLabel} preparation`}
      nextSteps={nextKeys.map((k) => steps[k])}
    />
  );
}
