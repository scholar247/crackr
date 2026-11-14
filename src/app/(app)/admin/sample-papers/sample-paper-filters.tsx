'use client';

import { BookOpen, CalendarDays, GraduationCap, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export const ALL = 'all';

export interface Filters {
  /** Exam slug, or ALL. */
  exam: string;
  /** Year as a string ("2026"), or ALL. */
  year: string;
  /** Subject slug, or ALL. */
  subject: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

/**
 * Exam / year / subject filter bar for the admin list. Purely presentational: options and
 * counts are computed by the caller (each option's count reflects the *other* active
 * filters, so the numbers always match what selecting it would show on its own).
 */
export function SamplePaperFilters({
  filters,
  onChange,
  examOptions,
  yearOptions,
  subjectOptions,
  shown,
  total,
}: {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  examOptions: FilterOption[];
  yearOptions: FilterOption[];
  subjectOptions: FilterOption[];
  shown: number;
  total: number;
}) {
  const active = filters.exam !== ALL || filters.year !== ALL || filters.subject !== ALL;

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" /> Filter
        </span>

        <FilterSelect
          icon={<GraduationCap className="h-4 w-4" />}
          allLabel="All exams"
          value={filters.exam}
          options={examOptions}
          onChange={(exam) => onChange({ exam })}
          className="w-full sm:w-[220px]"
        />
        <FilterSelect
          icon={<CalendarDays className="h-4 w-4" />}
          allLabel="All years"
          value={filters.year}
          options={yearOptions}
          onChange={(year) => onChange({ year })}
          className="w-full sm:w-[160px]"
        />
        <FilterSelect
          icon={<BookOpen className="h-4 w-4" />}
          allLabel="All subjects"
          value={filters.subject}
          options={subjectOptions}
          onChange={(subject) => onChange({ subject })}
          className="w-full sm:w-[240px]"
        />

        <div className="ml-auto flex items-center gap-3 pl-1">
          <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
            {active ? (
              <>
                <span className="font-medium text-foreground">{shown}</span> of {total} papers
              </>
            ) : (
              <>
                {total} paper{total === 1 ? '' : 's'}
              </>
            )}
          </span>
          {active && (
            <Button variant="ghost" size="sm" onClick={() => onChange({ exam: ALL, year: ALL, subject: ALL })}>
              <X className="mr-1 h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  icon,
  allLabel,
  value,
  options,
  onChange,
  className,
}: {
  icon: React.ReactNode;
  allLabel: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const selected = value !== ALL;
  const total = options.reduce((sum, o) => sum + o.count, 0);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn('gap-2', selected && 'border-primary/50 bg-primary/5 text-foreground', className)}
        aria-label={allLabel.replace('All ', 'Filter by ')}
      >
        <span className={cn('shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}>{icon}</span>
        <span className="min-w-0 flex-1 truncate text-left">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectItem value={ALL}>
          <OptionLabel label={allLabel} count={total} />
        </SelectItem>
        {options.map((o) => (
          // Zero-count options stay selectable (dimmed): picking one switches context and the
          // caller drops whichever other filter clashes, rather than forcing a manual Clear.
          <SelectItem key={o.value} value={o.value} className={cn(o.count === 0 && o.value !== value && 'text-muted-foreground')}>
            <OptionLabel label={o.label} count={o.count} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OptionLabel({ label, count }: { label: string; count: number }) {
  return (
    <span className="flex w-full items-center justify-between gap-3">
      <span className="truncate">{label}</span>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">{count}</span>
    </span>
  );
}
