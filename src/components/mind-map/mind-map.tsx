'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Eye,
  ChevronDown,
  ChevronUp,
  Crosshair,
  FileDown,
  FoldVertical,
  Link2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Printer,
  RotateCcw,
  Scan,
  Search,
  Target,
  UnfoldVertical,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { MIND_MAP_FOCUS_PARAM, type MindMapTreeNode } from '@/lib/mind-maps';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SIZES, branchBounds, expandableIds, fitView, layoutMindMap, quizTargets, searchTree, subtreeIds, type LaidOutNode } from './layout';
import { CENTRE_CLASSES, colourFor } from './palette';

// Markdown (with maths) only loads when a node with extra content is opened.
const BlogContent = dynamic(() => import('@/components/blog/blog-content').then((m) => m.BlogContent), { ssr: false });

export interface NodeResources {
  mcqs: number;
  pyqs: number;
  notes: number;
  practiceHref: string | null;
  notesHref: string | null;
}

interface MindMapProps {
  /** Central node text. */
  title: { eyebrow: string; subject: string; chapter: string };
  nodes: MindMapTreeNode[];
  /** Live counts/links per node id (public pages); omitted in the admin preview. */
  resources?: Record<string, NodeResources>;
  /** Enables "explored" tracking in localStorage under this key. */
  storageKey?: string;
  /** Identifiers sent with analytics events (no personal data). */
  analytics?: { exam: string; chapter: string };
  /** Canonical URL for "copy link"/share. */
  shareUrl?: string;
  /**
   * Curriculum slug → node id. With `?focus=<slug>` in the URL the map opens on that node:
   * ancestors expanded, node selected, view centred (e.g. a topic link from the syllabus).
   */
  focusIndex?: Record<string, string>;
  className?: string;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));
const PRINT_BOX = { w: 1040, h: 700 }; // A4 landscape at 96 dpi, minus margins

// ── Explored nodes (per visitor, per map) ──────────────────────────────────────
const exploredListeners = new Set<() => void>();
const exploredCache = new Map<string, { raw: string | null; set: Set<string> }>();
const EMPTY_SET = new Set<string>();

function readExplored(key: string): Set<string> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY_SET;
  }
  const cached = exploredCache.get(key);
  if (cached && cached.raw === raw) return cached.set;
  let set = EMPTY_SET;
  try {
    set = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    set = new Set();
  }
  exploredCache.set(key, { raw, set });
  return set;
}

function markExplored(key: string, id: string) {
  const current = readExplored(key);
  if (current.has(id)) return;
  try {
    localStorage.setItem(key, JSON.stringify([...current, id]));
  } catch {
    return;
  }
  for (const l of exploredListeners) l();
}

function subscribeExplored(onChange: () => void) {
  exploredListeners.add(onChange);
  return () => exploredListeners.delete(onChange);
}

// ── Quiz results (per visitor, per map) ────────────────────────────────────────
// "Knew it" / "Missed" per hidden node, kept on the device like explored nodes.
interface QuizResults {
  knew: Set<string>;
  missed: Set<string>;
}
const EMPTY_QUIZ: QuizResults = { knew: new Set(), missed: new Set() };
const quizListeners = new Set<() => void>();
const quizCache = new Map<string, { raw: string | null; value: QuizResults }>();

function readQuiz(key: string): QuizResults {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY_QUIZ;
  }
  const hit = quizCache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  let value = EMPTY_QUIZ;
  try {
    const parsed = raw ? (JSON.parse(raw) as { knew?: string[]; missed?: string[] }) : {};
    value = { knew: new Set(parsed.knew ?? []), missed: new Set(parsed.missed ?? []) };
  } catch {
    value = { knew: new Set(), missed: new Set() };
  }
  quizCache.set(key, { raw, value });
  return value;
}

function writeQuiz(key: string, value: QuizResults) {
  try {
    localStorage.setItem(key, JSON.stringify({ knew: [...value.knew], missed: [...value.missed] }));
  } catch {
    return;
  }
  for (const l of quizListeners) l();
}

function subscribeQuiz(onChange: () => void) {
  quizListeners.add(onChange);
  return () => quizListeners.delete(onChange);
}

// ── Component ──────────────────────────────────────────────────────────────────

export function MindMap({ title, nodes, resources = {}, storageKey, analytics, shareUrl, focusIndex, className }: MindMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());

  // Index of the full tree: parent, children and depth per node.
  const index = useMemo(() => {
    const m = new Map<string, { node: MindMapTreeNode; parentId: string | null; siblings: MindMapTreeNode[]; path: string[] }>();
    const visit = (list: MindMapTreeNode[], parentId: string | null, path: string[]) => {
      for (const n of list) {
        m.set(n.id, { node: n, parentId, siblings: list, path });
        visit(n.children, n.id, [...path, n.label]);
      }
    };
    visit(nodes, null, []);
    return m;
  }, [nodes]);
  const totalNodes = index.size;

  // `?focus=<slug>` deep link. useSearchParams is available during the server render of
  // these (dynamic) pages, so the focused state is identical in the HTML and on hydration.
  const searchParams = useSearchParams();
  const [focusId] = useState<string | null>(() => {
    const key = searchParams.get(MIND_MAP_FOCUS_PARAM);
    const id = key ? focusIndex?.[key] : undefined;
    return id && index.has(id) ? id : null;
  });
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const open = new Set<string>();
    if (!focusId) return open;
    // Reveal the node (its ancestors) and show its own children too.
    for (let p = index.get(focusId)?.parentId ?? null; p; p = index.get(p)?.parentId ?? null) open.add(p);
    if ((index.get(focusId)?.node.children.length ?? 0) > 0) open.add(focusId);
    return open;
  });
  const [selectedId, setSelectedId] = useState<string | null>(focusId);
  /** Node to centre on after the first fit (consumed once). */
  const centreTarget = useRef(focusId);
  const [view, setView] = useState({ k: 0.85, tx: 0, ty: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const [query, setQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const pendingFit = useRef(true);

  const layout = useMemo(() => layoutMindMap(nodes, expanded), [nodes, expanded]);
  const byId = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);
  const storageKeyRef = useRef(storageKey);
  useEffect(() => {
    storageKeyRef.current = storageKey;
  }, [storageKey]);
  // Latest layout for callbacks that run after a re-render (search, keyboard, fullscreen).
  const layoutRef = useRef(byId);
  const layoutBoundsRef = useRef(layout.bounds);
  useEffect(() => {
    layoutRef.current = byId;
    layoutBoundsRef.current = layout.bounds;
  }, [byId, layout.bounds]);
  const search = useMemo(() => searchTree(nodes, query), [nodes, query]);
  const matchSet = useMemo(() => new Set(search.matches), [search]);
  const searching = query.trim().length >= 2;

  const explored = useSyncExternalStore(subscribeExplored, () => (storageKey ? readExplored(storageKey) : EMPTY_SET), () => EMPTY_SET);

  // ── Quiz mode: subtopics hidden behind cards; reveal, then mark "knew it" / "missed" ──
  const [quiz, setQuiz] = useState(false);
  // While quizzing, flag the page so content listing the answers (the topic outline and
  // revision notes, marked data-quiz-conceal) is blurred — see globals.css. Set only in the
  // browser after a student starts a quiz, so the server HTML crawlers see is unaffected.
  useEffect(() => {
    if (!quiz) return;
    document.documentElement.setAttribute('data-mindmap-quiz', '');
    return () => document.documentElement.removeAttribute('data-mindmap-quiz');
  }, [quiz]);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const quizKey = `mindmap-quiz:${storageKey ?? 'preview'}`;
  const quizResults = useSyncExternalStore(subscribeQuiz, () => readQuiz(quizKey), () => EMPTY_QUIZ);
  const targets = useMemo(() => quizTargets(nodes), [nodes]);
  const targetSet = useMemo(() => new Set(targets), [targets]);
  const isHidden = (id: string) => quiz && targetSet.has(id) && !revealed.has(id);

  // ── Analytics (each fires once per occurrence) ──
  const viewedSent = useRef(false);
  useEffect(() => {
    if (viewedSent.current || !analytics) return;
    viewedSent.current = true;
    trackEvent('mindmap_viewed', { ...analytics, nodes: totalNodes });
  }, [analytics, totalNodes]);
  const zoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackZoom = useCallback(() => {
    if (!analytics) return;
    if (zoomTimer.current) clearTimeout(zoomTimer.current);
    zoomTimer.current = setTimeout(() => trackEvent('mindmap_zoomed', analytics), 1000);
  }, [analytics]);

  // ── View helpers ──
  const viewportSize = () => {
    const el = viewportRef.current;
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 960, h: 600 };
  };

  const fit = useCallback(() => setView(fitView(layout.bounds, viewportSize())), [layout.bounds]);

  // Fit once the viewport has a size (first render) and whenever it changes size while a
  // fit is pending (entering/leaving fullscreen). Observer callbacks run asynchronously.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (!pendingFit.current) return;
      pendingFit.current = false;
      const fitted = fitView(layoutBoundsRef.current, { w: el.clientWidth, h: el.clientHeight });
      const target = centreTarget.current ? layoutRef.current.get(centreTarget.current) : undefined;
      if (target) {
        // Deep link: centre the focused node at a readable zoom instead of fitting everything.
        centreTarget.current = null;
        const k = Math.min(1.1, Math.max(0.8, fitted.k));
        setView({ k, tx: -(target.x + target.w / 2) * k, ty: -(target.y + target.h / 2) * k });
        if (storageKeyRef.current) markExplored(storageKeyRef.current, target.id);
      } else {
        setView(fitted);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const centreOn = useCallback((n: LaidOutNode) => {
    setView((v) => ({ ...v, tx: -(n.x + n.w / 2) * v.k, ty: -(n.y + n.h / 2) * v.k }));
  }, []);

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const el = viewportRef.current;
      setView((v) => {
        const k = clampZoom(v.k * factor);
        if (!el || clientX === undefined || clientY === undefined) return { k, tx: (v.tx * k) / v.k, ty: (v.ty * k) / v.k };
        const rect = el.getBoundingClientRect();
        const px = clientX - rect.left - rect.width / 2;
        const py = clientY - rect.top - rect.height / 2;
        return { k, tx: px - ((px - v.tx) * k) / v.k, ty: py - ((py - v.ty) * k) / v.k };
      });
      trackZoom();
    },
    [trackZoom],
  );

  // Wheel: ctrl/⌘ + wheel or trackpad pinch zooms (plain wheel keeps scrolling the page,
  // except in fullscreen where the map owns the screen). Needs a non-passive listener.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey || document.fullscreenElement)) return;
      e.preventDefault();
      zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Pointer pan (one pointer) and pinch zoom (two), for mouse, pen and touch.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-mindmap-chrome], [data-node]')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(dist / pinch.current.dist, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch.current.dist = dist;
      return;
    }
    setView((v) => ({ ...v, tx: v.tx + e.clientX - prev.x, ty: v.ty + e.clientY - prev.y }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  // ── Expand / collapse ──
  const toggle = useCallback(
    (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        const opening = !next.has(id);
        if (opening) next.add(id);
        else next.delete(id);
        if (analytics) trackEvent(opening ? 'mindmap_node_expanded' : 'mindmap_node_collapsed', { ...analytics, node: index.get(id)?.node.label });
        return next;
      });
    },
    [analytics, index],
  );

  /** Change what's expanded and fit the resulting layout in one step. */
  const setExpandedAndFit = (next: Set<string>) => {
    setExpanded(next);
    setView(fitView(layoutMindMap(nodes, next).bounds, viewportSize()));
  };
  const expandAll = () => setExpandedAndFit(expandableIds(nodes));
  const collapseAll = () => {
    setExpandedAndFit(new Set());
    setSelectedId(null);
  };

  const select = (id: string) => {
    setSelectedId(id);
    if (storageKey) markExplored(storageKey, id);
  };

  /**
   * After opening a branch, pan just enough (never zoom) that the node and its children are
   * inside the viewport — computed from the next layout, so it happens in the same render.
   */
  const keepBranchInView = (id: string, nextExpanded: Set<string>) => {
    const next = layoutMindMap(nodes, nextExpanded);
    const boxes = next.nodes.filter((b) => b.id === id || b.parentId === id);
    if (boxes.length === 0) return;
    const { w, h } = viewportSize();
    const pad = 24;
    setView((v) => {
      const minX = Math.min(...boxes.map((b) => b.x)) * v.k + v.tx + w / 2;
      const maxX = Math.max(...boxes.map((b) => b.x + b.w)) * v.k + v.tx + w / 2;
      const minY = Math.min(...boxes.map((b) => b.y)) * v.k + v.ty + h / 2;
      const maxY = Math.max(...boxes.map((b) => b.y + b.h)) * v.k + v.ty + h / 2;
      let dx = 0;
      let dy = 0;
      if (maxX > w - pad) dx = w - pad - maxX;
      if (minX + dx < pad) dx = pad - minX;
      if (maxY > h - pad) dy = h - pad - maxY;
      if (minY + dy < pad + 56) dy = pad + 56 - minY; // clear the toolbar
      return dx || dy ? { ...v, tx: v.tx + dx, ty: v.ty + dy } : v;
    });
  };

  /**
   * Focus mode: open a main topic's whole branch (every level), collapse the other topics,
   * and frame that branch with the chapter node — one clean topic at a time.
   */
  const focusBranch = (id: string) => {
    const entry = index.get(id);
    if (!entry) return;
    const next = expandableIds([entry.node]);
    setExpanded(next);
    setView(fitView(branchBounds(layoutMindMap(nodes, next), subtreeIds(entry.node)), viewportSize(), { padding: 72, min: 0.3, max: 1.1 }));
    if (analytics) trackEvent('mindmap_node_expanded', { ...analytics, node: entry.node.label, mode: 'focus' });
  };
  /** Back to the overview: only the main topics around the chapter. */
  const showOverview = () => setExpandedAndFit(new Set());

  const reveal = (id: string) => {
    setRevealed((prev) => new Set([...prev, id]));
    select(id);
  };

  const onNodeClick = (n: LaidOutNode) => {
    // In a quiz, the first tap on a hidden card reveals it.
    if (isHidden(n.id)) {
      reveal(n.id);
      return;
    }
    if (n.depth === 1 && n.childCount > 0) {
      if (n.expanded) showOverview();
      else focusBranch(n.id);
    } else if (n.childCount > 0) {
      const opening = !expanded.has(n.id);
      toggle(n.id);
      if (opening) keepBranchInView(n.id, new Set([...expanded, n.id]));
    }
    select(n.id);
  };

  const startQuiz = () => {
    onQueryChange('');
    setRevealed(new Set());
    setSelectedId(null);
    setQuiz(true);
    showOverview();
    if (analytics) trackEvent('mindmap_quiz_started', { ...analytics, cards: targets.length });
  };
  const exitQuiz = () => {
    setQuiz(false);
    setRevealed(new Set());
  };
  const revealAll = () => setRevealed(new Set(targets));
  const resetQuiz = () => {
    writeQuiz(quizKey, { knew: new Set(), missed: new Set() });
    setRevealed(new Set());
    setSelectedId(null);
  };

  /** Record a self-check, then move on to the next hidden card in the same group. */
  const answer = (id: string, knew: boolean) => {
    const next: QuizResults = { knew: new Set(quizResults.knew), missed: new Set(quizResults.missed) };
    next.knew.delete(id);
    next.missed.delete(id);
    (knew ? next.knew : next.missed).add(id);
    writeQuiz(quizKey, next);
    if (analytics) trackEvent('mindmap_quiz_answered', { ...analytics, result: knew ? 'knew' : 'missed' });
    const entry = index.get(id);
    const upcoming = entry?.siblings.find((s) => s.id !== id && targetSet.has(s.id) && !revealed.has(s.id));
    setSelectedId(upcoming?.id ?? null);
  };

  // ── Search: reveal matches (expand their ancestors), step through them ──
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onQueryChange = (value: string) => {
    setQuery(value);
    setMatchIndex(0);
    const result = searchTree(nodes, value);
    if (result.reveal.size > 0) setExpanded((prev) => new Set([...prev, ...result.reveal]));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (analytics && value.trim().length >= 2) searchTimer.current = setTimeout(() => trackEvent('mindmap_search_used', { ...analytics, results: result.matches.length }), 1200);
  };

  const goToMatch = useCallback(
    (i: number) => {
      if (search.matches.length === 0) return;
      const nextIndex = (i + search.matches.length) % search.matches.length;
      setMatchIndex(nextIndex);
      const id = search.matches[nextIndex];
      setSelectedId(id);
      // Centre once the revealed node has a layout position.
      requestAnimationFrame(() => {
        const n = layoutRef.current.get(id);
        if (n) centreOn(n);
      });
    },
    [search.matches, centreOn],
  );

  // ── Keyboard navigation between nodes ──
  const focusNode = (id: string | undefined) => {
    if (!id) return;
    requestAnimationFrame(() => {
      nodeRefs.current.get(id)?.focus();
      const n = layoutRef.current.get(id);
      if (n) centreOn(n);
    });
  };
  const onNodeKeyDown = (e: React.KeyboardEvent, n: LaidOutNode) => {
    const entry = index.get(n.id);
    if (!entry) return;
    const outward = n.side === 1 ? 'ArrowRight' : 'ArrowLeft';
    const inward = n.side === 1 ? 'ArrowLeft' : 'ArrowRight';
    if (e.key === outward) {
      e.preventDefault();
      if (n.childCount === 0) return;
      if (!n.expanded) {
        if (n.depth === 1) focusBranch(n.id);
        else toggle(n.id);
      } else focusNode(entry.node.children[0]?.id);
    } else if (e.key === inward) {
      e.preventDefault();
      if (n.expanded) {
        if (n.depth === 1) showOverview();
        else toggle(n.id);
      } else focusNode(entry.parentId ?? undefined);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      // Main topics sit on two sides: move among those on the same side, like the eye does.
      const column = entry.siblings.filter((s) => byId.get(s.id)?.side === n.side);
      const i = column.findIndex((s) => s.id === n.id);
      focusNode(column[i + (e.key === 'ArrowDown' ? 1 : -1)]?.id);
    } else if (e.key === 'Escape') {
      setSelectedId(null);
    }
  };

  // ── Fullscreen ──
  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === wrapperRef.current);
      // The viewport resizes next; the ResizeObserver above refits once it has.
      pendingFit.current = true;
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await wrapperRef.current?.requestFullscreen();
        if (analytics) trackEvent('mindmap_fullscreen_opened', analytics);
      }
    } catch {
      toast.error('Fullscreen is not available in this browser');
    }
  };

  // ── Print / PDF: vector output of the fully expanded map via a print stylesheet ──
  const print = (kind: 'print' | 'pdf') => {
    const all = expandableIds(nodes);
    const fullLayout = layoutMindMap(nodes, all);
    const before = { expanded, view, quiz };
    setQuiz(false); // printouts always show the real labels
    setExpanded(all);
    setView(fitView(fullLayout.bounds, PRINT_BOX, { padding: 24, min: 0.1, max: 1 }));
    const pageStyle = document.createElement('style');
    pageStyle.textContent = '@page { size: A4 landscape; margin: 8mm; }';
    document.head.appendChild(pageStyle);
    document.documentElement.classList.add('mindmap-printing');
    const cleanup = () => {
      document.documentElement.classList.remove('mindmap-printing');
      pageStyle.remove();
      setExpanded(before.expanded);
      setView(before.view);
      setQuiz(before.quiz);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    if (kind === 'pdf') {
      toast.info('Choose “Save as PDF” as the destination to download.', { duration: 6000 });
      if (analytics) trackEvent('mindmap_pdf_downloaded', analytics);
    }
    // Two frames so the expanded layout is painted before the print snapshot.
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };

  const copyLink = async () => {
    const url = shareUrl ?? window.location.href;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) await navigator.share({ title: `${title.chapter} mind map`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      // Share sheet dismissed — nothing to do.
    }
  };

  const selected = selectedId ? index.get(selectedId) : undefined;
  const selectedLayout = selectedId ? byId.get(selectedId) : undefined;
  const selectedResources = selectedId ? resources[selectedId] : undefined;
  const exploredCount = useMemo(() => [...explored].filter((id) => index.has(id)).length, [explored, index]);
  const knewCount = targets.filter((id) => quizResults.knew.has(id)).length;
  const missedCount = targets.filter((id) => quizResults.missed.has(id)).length;
  const selectedHidden = selectedId ? isHidden(selectedId) : false;
  const selectedIsQuizCard = !!selectedId && quiz && targetSet.has(selectedId);

  return (
    <div
      ref={wrapperRef}
      data-mindmap-print-root
      className={cn('relative overflow-hidden rounded-2xl border border-border bg-surface-container-lowest', fullscreen ? 'h-screen rounded-none' : 'h-[min(72vh,640px)] min-h-[440px]', className)}
    >
      {/* Print-only heading */}
      <div className="hidden p-4 print:block">
        <p className="text-sm text-gray-600">{title.eyebrow} · {title.subject}</p>
        <p className="text-xl font-bold text-gray-900">{title.chapter} — mind map</p>
      </div>

      {/* Canvas */}
      <div
        ref={viewportRef}
        role="application"
        aria-label={`${title.chapter} mind map. Use Tab to move between topics, arrow keys to expand and navigate.`}
        className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if (!(e.target as HTMLElement).closest('[data-node], [data-mindmap-chrome]')) zoomAt(1.4, e.clientX, e.clientY);
        }}
        style={{
          backgroundImage: 'radial-gradient(circle, color-mix(in oklab, var(--border) 80%, transparent) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        <div className="absolute top-1/2 left-1/2" style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.k})`, transformOrigin: '0 0' }}>
          {/* Branch lines */}
          <svg
            className="pointer-events-none absolute overflow-visible"
            style={{ left: layout.bounds.minX, top: layout.bounds.minY }}
            width={layout.bounds.maxX - layout.bounds.minX}
            height={layout.bounds.maxY - layout.bounds.minY}
            viewBox={`${layout.bounds.minX} ${layout.bounds.minY} ${layout.bounds.maxX - layout.bounds.minX} ${layout.bounds.maxY - layout.bounds.minY}`}
            aria-hidden
          >
            {layout.links.map((l) => (
              <path
                key={l.id}
                d={l.d}
                fill="none"
                strokeLinecap="round"
                strokeWidth={l.depth === 1 ? 3 : 2}
                className={cn(colourFor(l.branch).stroke, l.depth > 1 && 'opacity-60', searching && !matchSet.has(l.id) && 'opacity-20', 'transition-opacity')}
              />
            ))}
          </svg>

          {/* Central node */}
          <div
            className={cn('absolute flex flex-col items-center justify-center rounded-2xl border-2 px-4 text-center shadow-lg', CENTRE_CLASSES)}
            style={{ left: -SIZES.center.w / 2, top: -SIZES.center.h / 2, width: SIZES.center.w, height: SIZES.center.h }}
          >
            <span className="text-[10px] font-semibold tracking-widest uppercase opacity-80">
              {title.eyebrow} · {title.subject}
            </span>
            <span className="mt-1 line-clamp-2 text-base leading-tight font-bold">{title.chapter}</span>
          </div>

          {/* Topic nodes */}
          {layout.nodes.map((n) => {
            const colour = colourFor(n.branch);
            const entry = index.get(n.id);
            const res = resources[n.id];
            const isSelected = selectedId === n.id;
            const isMatch = matchSet.has(n.id);
            const hidden = isHidden(n.id);
            const quizMark = quiz && targetSet.has(n.id) ? (quizResults.knew.has(n.id) ? 'knew' : quizResults.missed.has(n.id) ? 'missed' : null) : null;
            const hint = [n.childCount > 0 ? `${n.childCount} subtopic${n.childCount === 1 ? '' : 's'}` : null, res && res.mcqs > 0 ? `${res.mcqs} MCQs` : null]
              .filter(Boolean)
              .join(' · ');
            return (
              <div
                key={n.id}
                data-node
                className="group absolute motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
                style={{ transform: `translate(${n.x}px, ${n.y}px)`, width: n.w, height: n.h }}
              >
                <button
                  ref={(el) => {
                    if (el) nodeRefs.current.set(n.id, el);
                    else nodeRefs.current.delete(n.id);
                  }}
                  type="button"
                  onClick={() => onNodeClick(n)}
                  onKeyDown={(e) => onNodeKeyDown(e, n)}
                  aria-expanded={n.childCount > 0 ? n.expanded : undefined}
                  aria-label={
                    hidden
                      ? `Hidden ${n.depth === 1 ? 'topic' : 'subtopic'} — recall it, then tap to reveal`
                      : `${n.label}${hint ? `, ${hint}` : ''}${n.childCount > 0 ? (n.expanded ? ', expanded' : ', collapsed') : ''}`
                  }
                  className={cn(
                    'relative flex h-full w-full items-center gap-2 rounded-xl text-left shadow-sm transition-[box-shadow,transform,opacity] duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95',
                    n.depth === 1 ? cn('border-2 px-3', colour.topic) : cn('border px-3', colour.sub),
                    colour.ring.replace('ring-', 'focus-visible:ring-'),
                    isSelected && cn('ring-2 ring-offset-2 ring-offset-background', colour.ring),
                    isMatch && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-background',
                    searching && !isMatch && 'opacity-40',
                    hidden && 'border-dashed',
                  )}
                >
                  {n.depth > 1 && <span className={cn('h-2 w-2 shrink-0 rounded-full', colour.dot)} aria-hidden />}
                  {hidden ? (
                    // Placeholder bars instead of the label; the real text isn't rendered at all.
                    <span className="flex min-w-0 flex-1 items-center gap-2" aria-hidden>
                      <span className="flex-1 space-y-1.5">
                        <span className="block h-2 w-4/5 rounded-full bg-current opacity-20" />
                        <span className="block h-2 w-1/2 rounded-full bg-current opacity-20" />
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold opacity-60">Tap</span>
                    </span>
                  ) : (
                    <span className={cn('line-clamp-2 min-w-0 flex-1 leading-snug', n.depth === 1 ? 'text-sm font-semibold' : 'text-[13px] font-medium')}>{n.label}</span>
                  )}
                  {quizMark === 'knew' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="You knew this" />}
                  {quizMark === 'missed' && <XCircle className="h-4 w-4 shrink-0 text-warning" aria-label="You missed this" />}
                  {!quiz && explored.has(n.id) && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />}
                  {n.childCount > 0 && (
                    <span
                      className={cn(
                        'absolute top-1/2 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-background px-1 font-mono text-[10px] font-bold text-foreground shadow-sm',
                        n.side === 1 ? '-right-3' : '-left-3',
                        colour.topic.split(' ')[0],
                      )}
                      aria-hidden
                    >
                      {n.expanded ? '−' : `+${n.childCount}`}
                    </span>
                  )}
                </button>

                {/* Hover card */}
                {!hidden && (entry?.node.description || hint) && (
                  <div
                    role="tooltip"
                    className="pointer-events-none invisible absolute bottom-full left-1/2 z-10 mb-2 w-60 -translate-x-1/2 rounded-lg border border-border bg-popover p-2.5 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity delay-300 group-hover:visible group-hover:opacity-100"
                  >
                    {entry?.node.description && <p className="leading-snug">{entry.node.description}</p>}
                    {hint && <p className={cn('text-muted-foreground', entry?.node.description && 'mt-1.5')}>{hint}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top toolbar */}
      <div data-mindmap-chrome className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 p-3">
        {quiz ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 shadow-sm backdrop-blur sm:max-w-md">
            <Brain className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-foreground">Quiz</span>
            <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{knewCount}</span> knew · <span className="font-semibold text-warning">{missedCount}</span> missed ·{' '}
              {targets.length} cards
            </span>
            <span className="ml-auto flex items-center gap-1">
              <button type="button" onClick={revealAll} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-background/60" title="Reveal every card">
                <Eye className="h-3.5 w-3.5" /> Reveal all
              </button>
              <button type="button" onClick={resetQuiz} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-background/60" title="Clear your results and start again">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button type="button" onClick={exitQuiz} className="flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs font-semibold hover:bg-background/80">
                <X className="h-3.5 w-3.5" /> Exit
              </button>
            </span>
          </div>
        ) : (
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-border bg-card/95 px-2 shadow-sm backdrop-blur sm:max-w-xs">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                goToMatch(matchIndex + (e.shiftKey ? -1 : searching && selectedId === search.matches[matchIndex] ? 1 : 0));
              }
            }}
            placeholder="Search this mind map"
            aria-label="Search this mind map"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searching && (
            <>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums" aria-live="polite">
                {search.matches.length ? `${matchIndex + 1}/${search.matches.length}` : '0'}
              </span>
              <button type="button" onClick={() => goToMatch(matchIndex - 1)} aria-label="Previous match" className="rounded p-1 hover:bg-muted" disabled={!search.matches.length}>
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => goToMatch(matchIndex + 1)} aria-label="Next match" className="rounded p-1 hover:bg-muted" disabled={!search.matches.length}>
                <ChevronDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onQueryChange('')} aria-label="Clear search" className="rounded p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-xl border border-border bg-card/95 p-1 shadow-sm backdrop-blur">
          {storageKey && totalNodes > 0 && (
            <span className="hidden px-2 text-xs text-muted-foreground tabular-nums md:inline" title="Topics you've opened on this device">
              Explored {exploredCount}/{totalNodes}
            </span>
          )}
          {targets.length > 0 && !quiz && (
            <button
              type="button"
              onClick={startQuiz}
              title="Hide the subtopics and test your recall"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Brain className="h-4 w-4" /> Quiz me
            </button>
          )}
          <ToolButton label="Expand all" onClick={expandAll} icon={<UnfoldVertical className="h-4 w-4" />} text="Expand all" />
          <ToolButton label="Collapse all" onClick={collapseAll} icon={<FoldVertical className="h-4 w-4" />} text="Collapse" />
          <ToolButton label="Fit to screen" onClick={fit} icon={<Scan className="h-4 w-4" />} />
          <ToolButton label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFullscreen} icon={fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="More options" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => print('pdf')}>
                <FileDown className="h-4 w-4" /> Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => print('print')}>
                <Printer className="h-4 w-4" /> Print
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copyLink}>
                <Link2 className="h-4 w-4" /> Copy link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Zoom controls */}
      <div data-mindmap-chrome className="absolute bottom-3 left-3 flex items-center gap-1 rounded-xl border border-border bg-card/95 p-1 shadow-sm backdrop-blur">
        <ToolButton label="Zoom out" onClick={() => zoomAt(1 / 1.25)} icon={<ZoomOut className="h-4 w-4" />} />
        <span className="w-12 text-center text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {Math.round(view.k * 100)}%
        </span>
        <ToolButton label="Zoom in" onClick={() => zoomAt(1.25)} icon={<ZoomIn className="h-4 w-4" />} />
        <ToolButton label="Reset zoom" onClick={() => setView({ k: 1, tx: 0, ty: 0 })} icon={<Crosshair className="h-4 w-4" />} />
        <span className="hidden pr-2 pl-1 text-[11px] text-muted-foreground lg:inline">Drag to move · Ctrl + scroll to zoom</span>
      </div>

      {quiz && expanded.size === 0 && !selectedId && (
        <div data-mindmap-chrome className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center px-3">
          <p className="rounded-full border border-primary/30 bg-card/95 px-4 py-2 text-center text-xs text-foreground shadow-sm backdrop-blur">
            Pick a topic, recall its subtopics, then tap each card to check yourself.
          </p>
        </div>
      )}

      {/* Details panel for the selected node */}
      {selected && selectedLayout && (
        <aside
          data-mindmap-chrome
          aria-label={`${selected.node.label} details`}
          className="absolute inset-x-3 bottom-3 max-h-[55%] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl sm:inset-x-auto sm:right-3 sm:w-80 motion-safe:animate-in motion-safe:slide-in-from-bottom-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {selected.path.length > 0 && <p className="truncate text-[11px] text-muted-foreground">{[title.chapter, ...selected.path].join(' › ')}</p>}
              <h3 className="mt-0.5 flex items-center gap-2 font-semibold text-foreground">
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', colourFor(selectedLayout.branch).dot)} aria-hidden />
                {selectedHidden ? 'What is this?' : selected.node.label}
              </h3>
            </div>
            <button type="button" onClick={() => setSelectedId(null)} aria-label="Close details" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedHidden ? (
            <div className="mt-2">
              <p className="text-body-sm text-muted-foreground">Recall this subtopic — say it or jot it down — then reveal it to check.</p>
              <button
                type="button"
                onClick={() => reveal(selected.node.id)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Eye className="h-3.5 w-3.5" /> Reveal
              </button>
            </div>
          ) : (
            <>
          {selectedIsQuizCard && (
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-foreground">Did you remember it?</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => answer(selected.node.id, true)}
                  aria-pressed={quizResults.knew.has(selected.node.id)}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    quizResults.knew.has(selected.node.id) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300',
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Knew it
                </button>
                <button
                  type="button"
                  onClick={() => answer(selected.node.id, false)}
                  aria-pressed={quizResults.missed.has(selected.node.id)}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    quizResults.missed.has(selected.node.id) ? 'border-warning bg-warning text-background' : 'border-warning/50 text-warning hover:bg-warning/10',
                  )}
                >
                  <XCircle className="h-3.5 w-3.5" /> Missed
                </button>
              </div>
            </div>
          )}
          {selected.node.description && <p className="text-body-sm mt-2 text-muted-foreground">{selected.node.description}</p>}
          {selected.node.content && (
            <div className="mt-3 text-sm [&_.blog-content]:text-sm">
              <BlogContent content={selected.node.content} />
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {selected.node.children.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                {selected.node.children.length} subtopic{selected.node.children.length === 1 ? '' : 's'}
              </span>
            )}
            {selectedResources && selectedResources.mcqs > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{selectedResources.mcqs} MCQs</span>}
            {selectedResources && selectedResources.pyqs > 0 && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-warning">{selectedResources.pyqs} PYQs</span>}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedResources?.practiceHref && (
              <Link
                href={selectedResources.practiceHref}
                onClick={() => analytics && trackEvent('mindmap_practice_clicked', { ...analytics, node: selected.node.label })}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Target className="h-3.5 w-3.5" /> Practise {selectedResources.mcqs} MCQs
              </Link>
            )}
            {selectedResources?.notesHref && (
              <Link
                href={selectedResources.notesHref}
                onClick={() => analytics && trackEvent('mindmap_topic_opened', { ...analytics, node: selected.node.label })}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/40"
              >
                <BookOpen className="h-3.5 w-3.5" /> Read notes
              </Link>
            )}
            {selected.node.children.length > 0 && (
              <button type="button" onClick={() => toggle(selected.node.id)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/40">
                {expanded.has(selected.node.id) ? 'Collapse' : 'Expand'} branch
              </button>
            )}
          </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
}

function ToolButton({ label, onClick, icon, text }: { label: string; onClick: () => void; icon: React.ReactNode; text?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
      {icon}
      {text && <span className="hidden text-xs font-medium xl:inline">{text}</span>}
    </button>
  );
}
