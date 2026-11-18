'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SECTION_ICONS } from './exam-nav-icons';
import { cn } from '@/lib/utils';

export interface ExamNavBarItem {
  key: string;
  label: string;
  href: string;
}

/** Sections to flag with a small "new" dot. */
const NEW = new Set(['mind-maps']);

// The exam's section menu: sticky under the site header, pill-style with icons. It scrolls
// sideways when it doesn't fit — the current section is scrolled into view, the edges fade
// and (on pointer devices) arrows appear, so it's obvious there is more.
export function ExamNavBar({ label, items, current }: { label: string; items: readonly ExamNavBarItem[]; current?: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // Bring the current section into view (centred) without moving the page.
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) el.scrollLeft = active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2;

    const update = () => setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  return (
    <nav aria-label={label} className="sticky top-14 z-30 border-b border-border bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/75">
      <div className="relative mx-auto max-w-page">
        <div
          ref={scroller}
          className={cn(
            'flex items-center gap-1 overflow-x-auto scroll-smooth px-3 py-1.5 sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden',
            // Fade the edge(s) that hide more items.
            edges.left && edges.right && '[mask-image:linear-gradient(to_right,transparent,black_40px,black_calc(100%-40px),transparent)]',
            edges.left && !edges.right && '[mask-image:linear-gradient(to_right,transparent,black_40px)]',
            !edges.left && edges.right && '[mask-image:linear-gradient(to_left,transparent,black_40px)]',
          )}
        >
          {items.map((item) => {
            const Icon = SECTION_ICONS[item.key];
            const isCurrent = current === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-all',
                  isCurrent
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95',
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                {item.label}
                {NEW.has(item.key) && !isCurrent && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-background" aria-label="New" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Arrows for mouse users when the menu overflows (touch users swipe). */}
        {edges.left && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll sections left"
            className="absolute top-1/2 left-1 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md hover:text-foreground pointer-fine:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {edges.right && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll sections right"
            className="absolute top-1/2 right-1 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md hover:text-foreground pointer-fine:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </nav>
  );
}

