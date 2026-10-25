import { BadgeCheck, ExternalLink, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Two labels that keep official exam facts and SyllabuzAI's advice visibly apart.

export function OfficialSourceNote({
  source,
  className,
}: {
  source: { label: string; url: string; checkedOn: string };
  className?: string;
}) {
  return (
    <p className={cn('text-body-sm flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground', className)}>
      <BadgeCheck className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
      <span>Official information from</span>
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline">
        {source.label}
        <ExternalLink className="h-3 w-3" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      <span>· checked {format(new Date(source.checkedOn), 'd MMM yyyy')}</span>
    </p>
  );
}

export function RecommendationTag({ className }: { className?: string }) {
  return (
    <span className={cn('text-label-caps inline-flex items-center gap-1 rounded-full bg-tertiary/10 px-2.5 py-1 uppercase text-tertiary', className)}>
      <Lightbulb className="h-3 w-3" aria-hidden />
      SyllabuzAI recommendation
    </span>
  );
}
