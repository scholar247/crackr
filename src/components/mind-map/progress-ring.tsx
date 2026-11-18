import { cn } from '@/lib/utils';

/** Small circular progress (done/total) — topic nodes and chips. */
export function ProgressRing({ done, total, size = 22, label = 'explored', className }: { done: number; total: number; size?: number; label?: string; className?: string }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const complete = total > 0 && done >= total;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn('shrink-0 -rotate-90', className)} role="img" aria-label={`${done} of ${total} ${label}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} className="stroke-current opacity-15" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        className={cn('motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500', complete ? 'stroke-emerald-500' : 'stroke-current')}
      />
    </svg>
  );
}
