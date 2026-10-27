'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Copy, Maximize, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface GraphItem {
  id: string;
  nodeType: string;
  name: string;
  slug: string;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

export const NODE_W = 248;
export const NODE_H = 84;
export const COL_GAP = 72;
export const ROW_GAP = 14;
const MIN_ZOOM = 0.08;
const MAX_ZOOM = 2.5;

export const TYPE_ORDER = ['SUBJECT', 'CHAPTER', 'TOPIC', 'SUBTOPIC'] as const;

export const TYPE_STYLE: Record<string, { accent: string; text: string }> = {
  EXAM: { accent: 'border-l-violet-500', text: 'text-violet-600 dark:text-violet-400' },
  SUBJECT: { accent: 'border-l-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  CHAPTER: { accent: 'border-l-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  TOPIC: { accent: 'border-l-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  SUBTOPIC: { accent: 'border-l-rose-500', text: 'text-rose-600 dark:text-rose-400' },
};

export function typeRank(nodeType: string) {
  const i = TYPE_ORDER.indexOf(nodeType as (typeof TYPE_ORDER)[number]);
  return i === -1 ? -1 : i;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load');
  return (await res.json()).data;
}

export function copy(value: string, label: string) {
  navigator.clipboard.writeText(value).then(
    () => toast.success(`${label} copied`),
    () => toast.error('Copy failed'),
  );
}

/**
 * Pannable / zoomable viewport. Content is laid out in graph coordinates (width × height)
 * and re-framed to fit whenever `fitKey` changes. Scroll zooms around the pointer, dragging
 * the background pans; anything marked `data-graph-node` keeps its own pointer events.
 */
export function GraphCanvas({
  width,
  height,
  fitKey,
  overlay,
  children,
}: {
  width: number;
  height: number;
  fitKey: string;
  overlay?: ReactNode;
  children?: ReactNode;
}) {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origin: Transform } | null>(null);

  const fitToView = useCallback(() => {
    const el = viewportRef.current;
    if (!el || !width || !height) return;
    const pad = 48;
    const k = Math.max(MIN_ZOOM, Math.min((el.clientWidth - pad * 2) / width, (el.clientHeight - pad * 2) / height, 1));
    setTransform({ k, x: (el.clientWidth - width * k) / 2, y: Math.max(pad, (el.clientHeight - height * k) / 2) });
    // Only re-frame when the caller says the content changed, not on every size tweak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  useEffect(() => {
    const frame = requestAnimationFrame(fitToView);
    return () => cancelAnimationFrame(frame);
  }, [fitToView]);

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const px = cx ?? el.clientWidth / 2;
    const py = cy ?? el.clientHeight / 2;
    setTransform((t) => {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, t.k * factor));
      const ratio = k / t.k;
      return { k, x: px - (px - t.x) * ratio, y: py - (py - t.y) * ratio };
    });
  }, []);

  // React's onWheel is passive, so preventDefault (to stop the page scrolling) needs a native listener.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-graph-node], [data-graph-control]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: transform };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    setTransform({ ...drag.origin, x: drag.origin.x + e.clientX - drag.startX, y: drag.origin.y + e.clientY - drag.startY });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  return (
    <div
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative h-[calc(100vh-280px)] min-h-[420px] cursor-grab touch-none overflow-hidden bg-muted/30 select-none active:cursor-grabbing"
      style={{
        backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
        backgroundSize: `${24 * transform.k}px ${24 * transform.k}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
    >
      {overlay && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{overlay}</div>}

      {children && (
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`, width, height }}
        >
          {children}
        </div>
      )}

      <div data-graph-control className="absolute right-3 bottom-3 flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <Button variant="ghost" size="icon-sm" className="rounded-none" onClick={() => zoomAt(1.25)} title="Zoom in">
          <Plus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="rounded-none" onClick={() => zoomAt(0.8)} title="Zoom out">
          <Minus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="rounded-none" onClick={fitToView} title="Fit to view">
          <Maximize className="size-4" />
        </Button>
      </div>
      <div className="absolute bottom-3 left-3 rounded bg-card/80 px-2 py-1 font-mono text-[11px] text-muted-foreground">
        {Math.round(transform.k * 100)}%
      </div>
    </div>
  );
}

/** Cubic edge from the right side of a card at (x1, y1) to the left side of one at (x2, y2). */
export function EdgePath({ x1, y1, x2, y2, highlighted }: { x1: number; y1: number; x2: number; y2: number; highlighted?: boolean }) {
  const sx = x1 + NODE_W;
  const sy = y1 + NODE_H / 2;
  const ty = y2 + NODE_H / 2;
  const mid = (sx + x2) / 2;
  return (
    <path
      d={`M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ty}, ${x2} ${ty}`}
      fill="none"
      strokeWidth={highlighted ? 2.5 : 1.5}
      className={highlighted ? 'stroke-primary' : 'stroke-muted-foreground/40'}
    />
  );
}

export function NodeCard({
  item,
  x,
  y,
  isFocus,
  isSelected,
  dimmed,
  chips,
  actionIcon,
  actionTitle,
  onSelect,
  onActivate,
}: {
  item: GraphItem;
  x: number;
  y: number;
  isFocus?: boolean;
  isSelected?: boolean;
  dimmed?: boolean;
  chips?: ReactNode;
  actionIcon?: ReactNode;
  actionTitle?: string;
  onSelect: () => void;
  onActivate?: () => void;
}) {
  const style = TYPE_STYLE[item.nodeType] ?? TYPE_STYLE.SUBTOPIC;
  return (
    <div
      data-graph-node
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onActivate?.();
        if (e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'absolute flex cursor-pointer flex-col justify-center gap-0.5 rounded-md border border-l-4 border-border bg-card px-3 py-2 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none',
        style.accent,
        isFocus && 'ring-2 ring-primary/40',
        isSelected && 'ring-2 ring-primary',
        dimmed && 'opacity-60',
      )}
      style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
      title={`${item.name}\nslug: ${item.slug}\nid: ${item.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('font-mono text-[10px] font-semibold tracking-wide uppercase', style.text)}>{item.nodeType}</span>
        <span className="flex items-center gap-1">
          {chips}
          {actionIcon && onActivate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onActivate();
              }}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title={actionTitle}
            >
              {actionIcon}
            </button>
          )}
        </span>
      </div>
      <div className="truncate text-sm font-semibold text-foreground">{item.name}</div>
      <div className="truncate font-mono text-[11px] text-muted-foreground">{item.slug}</div>
      <div className="truncate font-mono text-[10px] text-muted-foreground/70">{item.id}</div>
    </div>
  );
}

export function Chip({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span title={title} className="rounded-full bg-muted px-1.5 font-mono text-[10px] whitespace-nowrap text-muted-foreground">
      {children}
    </span>
  );
}

/** Type label + title + copyable title/slug/ID rows, shared by both views' details panels. */
export function ItemSummary({ item }: { item: GraphItem }) {
  const style = TYPE_STYLE[item.nodeType] ?? TYPE_STYLE.SUBTOPIC;
  const fields = [
    { label: 'Title', value: item.name, mono: false },
    { label: 'Slug', value: item.slug, mono: true },
    { label: 'ID', value: item.id, mono: true },
  ];
  return (
    <>
      <div>
        <span className={cn('font-mono text-[11px] font-semibold tracking-wide uppercase', style.text)}>{item.nodeType}</span>
        <h2 className="mt-0.5 text-base font-semibold break-words text-foreground">{item.name}</h2>
      </div>
      <dl className="space-y-3">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-xs text-muted-foreground">{f.label}</dt>
            <dd className="mt-0.5 flex items-start gap-1.5">
              <span className={cn('min-w-0 flex-1 text-sm break-all text-foreground', f.mono && 'font-mono text-xs')}>{f.value}</span>
              <button
                type="button"
                onClick={() => copy(f.value, f.label)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={`Copy ${f.label.toLowerCase()}`}
              >
                <Copy className="size-3.5" />
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
