import Link from 'next/link';
import { Bell, FileStack, House, Network, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { cbsePath, type CbseNavKey } from './paths';

// App-style bottom bar on phones and tablets (hidden on laptops, where the section nav is
// enough): the five things students open most, within thumb reach.
export function MobileDock({
  board,
  current,
  practiceHref,
  hasMindMaps = true,
  newNotices = 0,
}: {
  board: CbseBoard;
  current?: CbseNavKey;
  practiceHref?: string;
  hasMindMaps?: boolean;
  newNotices?: number;
}) {
  const slug = board.examSlug;
  const items = [
    { key: 'overview', href: current === 'overview' ? `${cbsePath(slug)}#top` : cbsePath(slug), label: 'Home', icon: House },
    { key: 'practice', href: practiceHref ?? cbsePath(slug, 'practice'), label: 'Practice', icon: Target },
    hasMindMaps ? { key: 'mind-maps', href: cbsePath(slug, 'mind-maps'), label: 'Mind maps', icon: Network } : null,
    { key: 'sample-papers', href: cbsePath(slug, 'sample-papers'), label: 'Papers', icon: FileStack },
    { key: 'updates', href: `${cbsePath(slug)}#notifications`, label: 'Updates', icon: Bell, badge: newNotices },
  ].filter((i): i is NonNullable<typeof i> => !!i);

  return (
    <nav aria-label={`${board.label} quick navigation`} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur-lg lg:hidden">
      <ul className="mx-auto flex max-w-xl items-stretch justify-around">
        {items.map(({ key, href, label, icon: Icon, badge }) => (
          <li key={label} className="flex-1">
            <Link
              href={href}
              aria-current={key === current ? 'page' : undefined}
              className={cn(
                'relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors hover:text-primary active:scale-95',
                key === current ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {key === current && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden />}
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden />
                {badge ? (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{badge}</span>
                ) : null}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
