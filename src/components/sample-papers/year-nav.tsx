import Link from 'next/link';
import { cn } from '@/lib/utils';
import { periodLabel, samplePapersPath, type SamplePaperExamConfig } from '@/lib/sample-papers';

/** Session switcher as plain links (crawlable, works without JS). `current` undefined = "All". */
export function YearNav({ examSlug, cfg, years, current }: { examSlug: string; cfg: SamplePaperExamConfig; years: number[]; current?: number }) {
  const pill = (active: boolean) =>
    cn(
      'text-body-sm rounded-full border px-4 py-1.5 font-medium transition-colors',
      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
    );

  return (
    <nav aria-label={cfg.isBoard ? 'Sample paper sessions' : 'Sample paper years'} className="flex flex-wrap gap-2">
      <Link href={samplePapersPath(examSlug)} className={pill(current === undefined)} aria-current={current === undefined ? 'page' : undefined}>
        {cfg.isBoard ? 'All sessions' : 'All years'}
      </Link>
      {years.map((y) => (
        <Link key={y} href={samplePapersPath(examSlug, y)} className={pill(current === y)} aria-current={current === y ? 'page' : undefined}>
          {periodLabel(cfg, y)}
        </Link>
      ))}
    </nav>
  );
}
