'use client';

import { useState } from 'react';
import { Bell, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNotificationDate, noticeAnchor } from '@/lib/notifications';
import { OPEN_NOTICE_EVENT } from './notification-board';
import { useReducedMotion } from './use-auto-scroll';

export interface TickerNotice {
  id: string;
  slug: string;
  title: string;
  publishedAt: string;
  isImportant: boolean;
}

/** Seconds per character of headline — keeps the scroll speed constant however many there are. */
const SECONDS_PER_CHAR = 0.18;

// "Latest" strip under the exam section menu: the newest headlines scroll continuously
// right-to-left (pausing on hover, keyboard focus or the pause button). Reduced-motion
// visitors get a still, swipeable row instead. Clicking a headline opens it on the board.
export function NotificationTicker({ notices }: { notices: TickerNotice[] }) {
  const reducedMotion = useReducedMotion();
  const [stopped, setStopped] = useState(false);
  if (notices.length === 0) return null;

  const open = (slug: string) => {
    history.replaceState(null, '', `#${noticeAnchor(slug)}`);
    window.dispatchEvent(new CustomEvent(OPEN_NOTICE_EVENT, { detail: slug }));
  };

  const chars = notices.reduce((sum, n) => sum + n.title.length + 18, 0);
  const duration = `${Math.max(20, Math.round(chars * SECONDS_PER_CHAR))}s`;

  // One copy of the headlines; the second copy (for the seamless loop) is hidden from
  // assistive tech and the tab order.
  const headlines = (copy: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={copy || undefined}>
      {notices.map((n) => (
        <li key={n.id} className="flex items-center">
          <button
            type="button"
            tabIndex={copy ? -1 : undefined}
            onClick={() => open(n.slug)}
            className="flex items-center gap-2 px-4 text-sm whitespace-nowrap focus-visible:underline focus-visible:outline-none"
          >
            {n.isImportant && <span className="rounded bg-warning/15 px-1.5 text-[10px] font-bold uppercase text-warning">Important</span>}
            <span className="font-medium text-foreground hover:text-primary hover:underline">{n.title}</span>
            <span className="text-xs text-muted-foreground">· {formatNotificationDate(n.publishedAt)}</span>
          </button>
          <span className="h-1 w-1 rounded-full bg-primary/50" aria-hidden />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="border-b border-border bg-primary/5">
      <div className="mx-auto flex max-w-page items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
          <span className="relative flex h-2 w-2">
            {!reducedMotion && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground/70" />}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground" />
          </span>
          <Bell className="h-3 w-3" aria-hidden />
          Latest
        </span>

        <div
          role="region"
          aria-label="Latest notifications"
          className={cn(
            'group relative min-w-0 flex-1',
            reducedMotion
              ? 'overflow-x-auto [&::-webkit-scrollbar]:hidden'
              : 'overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]',
          )}
        >
          <div
            className={cn(
              'flex w-max',
              !reducedMotion && 'animate-[notice-marquee_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]',
              stopped && '[animation-play-state:paused]',
            )}
            style={reducedMotion ? undefined : { animationDuration: duration }}
          >
            {headlines(false)}
            {!reducedMotion && headlines(true)}
          </div>
        </div>

        {!reducedMotion && (
          <button
            type="button"
            onClick={() => setStopped((v) => !v)}
            aria-pressed={stopped}
            aria-label={stopped ? 'Resume scrolling headlines' : 'Pause scrolling headlines'}
            title={stopped ? 'Resume' : 'Pause'}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {stopped ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
