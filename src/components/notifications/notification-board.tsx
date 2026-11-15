'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AlertTriangle, Bell, Check, ChevronDown, ExternalLink, Link2, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NOTIFICATION_CATEGORY_LABELS, noticeAnchor, noticeDayParts, type NotificationCategory } from '@/lib/notifications';
import { useAutoScroll, useReducedMotion } from './use-auto-scroll';

export interface BoardNotice {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: NotificationCategory;
  isImportant: boolean;
  /** Published within the last few days (decided on the server). */
  isNew: boolean;
  /** ISO timestamp. */
  publishedAt: string;
  sourceUrl: string | null;
  /** Full body, rendered on the server so it's in the page HTML even while collapsed. */
  body: ReactNode;
}

/** Fired by the ticker (or anything else) to open a notice on the board. */
export const OPEN_NOTICE_EVENT = 'open-notice';

const SEEN_KEY = 'seen-notices';
const ALL = 'ALL';

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>) {
  try {
    // Only the newest ids matter for "New" badges; cap so storage never grows unbounded.
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    // Private mode / blocked storage: unread markers just won't persist.
  }
}

// "Seen" ids as an external store over localStorage: one cached Set (stable snapshot),
// updated in place by addSeen and by other tabs via the storage event. The server
// snapshot is empty, so the first client render matches the server HTML.
const NO_SEEN = new Set<string>();
const seenListeners = new Set<() => void>();
let seenCache: Set<string> | null = null;

function getSeen() {
  return (seenCache ??= readSeen());
}

function subscribeSeen(onChange: () => void) {
  seenListeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== SEEN_KEY) return;
    seenCache = null;
    onChange();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    seenListeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

function addSeen(ids: string[]) {
  const next = new Set(getSeen());
  for (const id of ids) next.add(id);
  seenCache = next;
  writeSeen(next);
  for (const listener of seenListeners) listener();
}

// The exam home page's notification board: an auto-scrolling, newest-first list with
// category filters, notices that expand in place to the full text and official source,
// deep links (#notice-{slug}) that open a notice directly, and per-visitor unread markers
// kept in localStorage. Auto-scroll pauses on hover/focus, while a notice is open, and
// on request; it's off entirely for reduced-motion users.
export function NotificationBoard({ notices, title, emptyText }: { notices: BoardNotice[]; title: string; emptyText: string }) {
  const [category, setCategory] = useState<NotificationCategory | typeof ALL>(ALL);
  const [openId, setOpenId] = useState<string | null>(null);
  const seen = useSyncExternalStore(subscribeSeen, getSeen, () => NO_SEEN);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<NotificationCategory, number>();
    for (const n of notices) counts.set(n.category, (counts.get(n.category) ?? 0) + 1);
    return [...counts];
  }, [notices]);

  const filtered = category === ALL ? notices : notices.filter((n) => n.category === category);
  const unread = notices.filter((n) => n.isNew && !seen.has(n.id)).length;

  const listRef = useRef<HTMLOListElement>(null);
  const reducedMotion = useReducedMotion();
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const canAutoScroll = !reducedMotion && filtered.length > 3;
  useAutoScroll(listRef, { enabled: canAutoScroll, paused: stopped || hovering || focused || openId !== null });

  /** Open a notice by slug: clear filters, expand it, then scroll to it. */
  const openSlug = useCallback(
    (slug: string) => {
      const notice = notices.find((n) => n.slug === slug);
      if (!notice) return;
      setCategory(ALL);
      setOpenId(notice.id);
      addSeen([notice.id]);
      requestAnimationFrame(() =>
        document.getElementById(noticeAnchor(slug))?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'center',
        }),
      );
    },
    [notices],
  );

  // Deep links: #notice-{slug} on load or later, and open requests from the ticker.
  useEffect(() => {
    const fromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash.startsWith('notice-')) openSlug(hash.slice('notice-'.length));
    };
    const fromEvent = (e: Event) => openSlug((e as CustomEvent<string>).detail);
    fromHash();
    window.addEventListener('hashchange', fromHash);
    window.addEventListener(OPEN_NOTICE_EVENT, fromEvent);
    return () => {
      window.removeEventListener('hashchange', fromHash);
      window.removeEventListener(OPEN_NOTICE_EVENT, fromEvent);
    };
  }, [openSlug]);

  const toggle = (n: BoardNotice) => {
    if (openId === n.id) {
      setOpenId(null);
      return;
    }
    setOpenId(n.id);
    addSeen([n.id]);
    // Keep the address shareable without the browser jumping to the anchor.
    history.replaceState(null, '', `#${noticeAnchor(n.slug)}`);
  };

  const copyLink = async (n: BoardNotice) => {
    const url = `${window.location.origin}${window.location.pathname}#${noticeAnchor(n.slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(n.id);
      setTimeout(() => setCopiedId((id) => (id === n.id ? null : id)), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  const chip = (active: boolean) =>
    cn(
      'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
    );

  return (
    <section id="notifications" aria-labelledby="notifications-heading" className="scroll-mt-32 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 id="notifications-heading" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="h-4 w-4" aria-hidden />
            {unread > 0 && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card" aria-hidden />}
          </span>
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-1.5">
          {unread > 0 && (
            <button
              type="button"
              onClick={() => addSeen(notices.map((n) => n.id))}
              className="rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
              title="Mark all as read"
            >
              {unread} new
            </button>
          )}
          {canAutoScroll && (
            <button
              type="button"
              onClick={() => setStopped((v) => !v)}
              aria-pressed={stopped}
              aria-label={stopped ? 'Resume auto-scroll' : 'Pause auto-scroll'}
              title={stopped ? 'Resume auto-scroll' : 'Pause auto-scroll'}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {stopped ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          )}
        </div>
      </header>

      {notices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <Bell className="h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="font-medium text-foreground">No notifications yet</p>
          <p className="text-body-sm max-w-xs text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <>
          {categories.length > 1 && (
            <div role="group" aria-label="Filter notifications by category" className="flex gap-2 overflow-x-auto border-b border-border px-5 py-3 [&::-webkit-scrollbar]:hidden">
              <button type="button" aria-pressed={category === ALL} onClick={() => setCategory(ALL)} className={chip(category === ALL)}>
                All · {notices.length}
              </button>
              {categories.map(([cat, count]) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={category === cat}
                  onClick={() => setCategory(cat)}
                  className={chip(category === cat)}
                >
                  {NOTIFICATION_CATEGORY_LABELS[cat]} · {count}
                </button>
              ))}
            </div>
          )}

          <ol
            ref={listRef}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            // Keyboard focus pauses (so it doesn't scroll away from the reader); mouse clicks rely on hover.
            onFocus={(e) => e.target.matches(':focus-visible') && setFocused(true)}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
            className="max-h-[26rem] divide-y divide-border overflow-y-auto overscroll-contain"
          >
            {filtered.map((n) => {
              const open = openId === n.id;
              const isUnread = n.isNew && !seen.has(n.id);
              const { day, month } = noticeDayParts(n.publishedAt);
              const panelId = `${noticeAnchor(n.slug)}-panel`;
              return (
                <li key={n.id} id={noticeAnchor(n.slug)} className={cn('scroll-mt-40', n.isImportant && 'border-l-4 border-l-warning bg-warning/5')}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => toggle(n)}
                      className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                    >
                      <time
                        dateTime={n.publishedAt}
                        className={cn(
                          'flex w-11 shrink-0 flex-col items-center rounded-lg border py-1 leading-tight',
                          n.isImportant ? 'border-warning/50 text-warning' : 'border-border text-muted-foreground',
                        )}
                      >
                        <span className="text-base font-bold text-foreground">{day}</span>
                        <span className="text-[10px] uppercase tracking-wide">{month}</span>
                      </time>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{NOTIFICATION_CATEGORY_LABELS[n.category]}</span>
                          {n.isImportant && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning">
                              <AlertTriangle className="h-2.5 w-2.5" aria-hidden /> Important
                            </span>
                          )}
                          {isUnread && <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold uppercase text-destructive-foreground">New</span>}
                        </span>
                        <span className={cn('mt-1 block text-sm leading-snug text-foreground', isUnread || n.isImportant ? 'font-semibold' : 'font-medium')}>{n.title}</span>
                        {!open && <span className="text-body-sm mt-1 line-clamp-1 block text-muted-foreground">{n.summary}</span>}
                      </span>
                      <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180 text-primary')} aria-hidden />
                    </button>
                  </h3>

                  {/* Always in the DOM (just hidden) so the full notice is part of the page's HTML. */}
                  <div id={panelId} hidden={!open} className="px-5 pb-5 sm:pl-[4.75rem]">
                    <p className="text-body-sm font-medium text-foreground">{n.summary}</p>
                    <div className="mt-3">{n.body}</div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {n.sourceUrl && (
                        <a
                          href={n.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          Official notice <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => copyLink(n)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      >
                        {copiedId === n.id ? <Check className="h-3.5 w-3.5 text-secondary" aria-hidden /> : <Link2 className="h-3.5 w-3.5" aria-hidden />}
                        <span aria-live="polite">{copiedId === n.id ? 'Link copied' : 'Copy link'}</span>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

        </>
      )}
    </section>
  );
}
