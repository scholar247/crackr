'use client';

import { useEffect, useState } from 'react';
import type { TocHeading } from '@/lib/toc';
import { cn } from '@/lib/utils';

function useActiveHeading(headings: TocHeading[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

function TocList({ headings, activeId }: { headings: TocHeading[]; activeId: string | null }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {headings.map((heading) => (
        <li key={heading.id} style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}>
          <a
            href={`#${heading.id}`}
            className={cn(
              'block py-0.5 transition-colors hover:text-foreground',
              activeId === heading.id ? 'text-primary font-medium' : 'text-muted-foreground'
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Collapsible "On this page" block — intended for above the article body on small/medium screens. */
export function TableOfContentsMobile({ headings }: { headings: TocHeading[] }) {
  const activeId = useActiveHeading(headings);
  if (headings.length === 0) return null;
  return (
    <details className="mb-6 rounded-lg border border-border bg-muted/30 p-3">
      <summary className="cursor-pointer text-sm font-medium select-none">On this page</summary>
      <div className="mt-3">
        <TocList headings={headings} activeId={activeId} />
      </div>
    </details>
  );
}

/** Sticky sidebar TOC — intended for the second column of a desktop `lg:grid` layout. */
export function TableOfContentsDesktop({ headings }: { headings: TocHeading[] }) {
  const activeId = useActiveHeading(headings);
  if (headings.length === 0) return null;
  return (
    <nav aria-label="Table of contents" className="sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">On this page</p>
      <TocList headings={headings} activeId={activeId} />
    </nav>
  );
}
