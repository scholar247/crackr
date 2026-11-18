'use client';

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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
  Info,
  Keyboard,
  Link2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Printer,
  RotateCcw,
  Scan,
  Search,
  Sparkles,
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
import { SIZES, branchBounds, expandableIds, fitView, layoutMindMap, layoutVertical, quizTargets, searchTree, subtreeIds, subtreeProgress, topicOf, type LaidOutNode } from './layout';
import { Confetti } from './confetti';
import { ProgressRing } from './progress-ring';
import { TopicChips } from './topic-chips';
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

// ── First-visit tip (dismissed once per device, for every map) ─────────────────
const TIP_KEY = 'mindmap-tip-dismissed';
const tipListeners = new Set<() => void>();
function readTipDismissed() {
  try {
    return localStorage.getItem(TIP_KEY) === '1';
  } catch {
    return true;
  }
}
function dismissTip() {
  try {
    localStorage.setItem(TIP_KEY, '1');
  } catch {
    return;
  }
  for (const l of tipListeners) l();
}
function subscribeTip(onChange: () => void) {
  tipListeners.add(onChange);
  return () => tipListeners.delete(onChange);
}

/** Below this container width the map becomes a vertical tree that scrolls with the page. */
const COMPACT_BELOW = 640;

const SHORTCUTS: [string, string][] = [
  ['/', 'Search the map'],
  ['Q', 'Quiz me / exit quiz'],
  ['E', 'Expand everything'],
  ['C', 'Collapse to topics'],
  ['F', 'Fullscreen'],
  ['0', 'Fit to screen'],
  ['+  −', 'Zoom in / out'],
  ['← → ↑ ↓', 'Move between topics'],
  ['Esc', 'Close the panel'],
  ['?', 'Show these shortcuts'],
];

const scrollBehavior = (): ScrollBehavior => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

// ── Component ──────────────────────────────────────────────────────────────────

export function MindMap({ title, nodes, resources = {}, storageKey, analytics, shareUrl, focusIndex, className }: MindMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const searchRef = useRef<HTMLInputElement>(null);

  // The container's width picks the presentation: a vertical tree on phones (no panning or
  // pinching — it scrolls like a list), the radial canvas on tablets and laptops.
  const [width, setWidth] = useState(0);
  const [printing, setPrinting] = useState(false);
  const compact = width > 0 && width < COMPACT_BELOW && !printing;
  const compactRef = useRef(false);

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [confetti, setConfetti] = useState<number | null>(null);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const nextCompact = w < COMPACT_BELOW;
      // Switching back to the canvas (e.g. rotating a tablet) needs a fresh fit.
      if (nextCompact !== compactRef.current) {
        compactRef.current = nextCompact;
        pendingFit.current = true;
      }
      setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const innerWidth = Math.max(0, width - 24);
  const layout = useMemo(() => (compact ? layoutVertical(nodes, expanded, innerWidth) : layoutMindMap(nodes, expanded)), [compact, nodes, expanded, innerWidth]);
  const byId = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);
  const storageKeyRef = useRef(storageKey);
  useEffect(() => {
    storageKeyRef.current = storageKey;
  }, [storageKey]);
  // Latest layout for callbacks that run after a re-render (search, keyboard, fullscreen).
  const layoutRef = useRef(byId);
  const layoutBoundsRef = useRef(layout.bounds);
  useLayoutEffect(() => {
    layoutRef.current = byId;
    layoutBoundsRef.current = layout.bounds;
  }, [byId, layout.bounds]);
  const search = useMemo(() => searchTree(nodes, query), [nodes, query]);
  const matchSet = useMemo(() => new Set(search.matches), [search]);
  const searching = query.trim().length >= 2;

  const focusScrolled = useRef(false);
  useEffect(() => {
    if (!compact || !focusId || focusScrolled.current) return;
    focusScrolled.current = true;
    requestAnimationFrame(() => nodeRefs.current.get(focusId)?.scrollIntoView({ block: 'center' }));
  }, [compact, focusId]);

  const tipDismissed = useSyncExternalStore(subscribeTip, readTipDismissed, () => true);

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
      if (compactRef.current) return;
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
    if (compact) return;
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
      if (minY + dy < pad) dy = pad - minY;
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
    if (compact) requestAnimationFrame(() => nodeRefs.current.get(id)?.scrollIntoView({ block: 'start', behavior: scrollBehavior() }));
    else setView(fitView(branchBounds(layoutMindMap(nodes, next), subtreeIds(entry.node)), viewportSize(), { padding: 72, min: 0.3, max: 1.1 }));
    if (analytics) trackEvent('mindmap_node_expanded', { ...analytics, node: entry.node.label, mode: 'focus' });
  };
  /** Back to the overview: only the main topics around the chapter. */
  const showOverview = () => setExpandedAndFit(new Set());

  const reveal = (id: string) => {
    setRevealed((prev) => new Set([...prev, id]));
    select(id);
    setSheetOpen(true);
  };

  const onNodeClick = (n: LaidOutNode) => {
    if (!tipDismissed) dismissTip();
    // In a quiz, the first tap on a hidden card reveals it.
    if (isHidden(n.id)) {
      reveal(n.id);
      return;
    }
    // Phones: the bottom sheet opens for leaves and quiz cards; branches just open/close
    // (their details sit behind the small info button).
    setSheetOpen(n.childCount === 0 || (quiz && targetSet.has(n.id)));
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

  /** Topic chip strip: one tap focuses a topic, "All topics" returns to the overview. */
  const onTopicChip = (id: string | null) => {
    if (!tipDismissed) dismissTip();
    setSheetOpen(false);
    if (!id) {
      showOverview();
      setSelectedId(null);
      return;
    }
    const entry = index.get(id);
    if (!entry) return;
    if (entry.node.children.length > 0) focusBranch(id);
    if (isHidden(id)) setSelectedId(id);
    else select(id);
  };

  const celebrate = () => {
    setConfetti((c) => (c ?? 0) + 1);
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
    confettiTimer.current = setTimeout(() => setConfetti(null), 1600);
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

    // Milestones: a topic fully answered, or the whole chapter.
    const topic = topicOf(nodes, id);
    if (!topic) return;
    const cards = [...subtreeIds(topic)].filter((t) => targetSet.has(t));
    const answeredIn = (r: QuizResults) => cards.filter((t) => r.knew.has(t) || r.missed.has(t)).length;
    if (answeredIn(next) < cards.length || answeredIn(quizResults) === cards.length) return;
    const recalled = cards.filter((t) => next.knew.has(t)).length;
    const chapterDone = targets.every((t) => next.knew.has(t) || next.missed.has(t));
    if (chapterDone) {
      const total = targets.filter((t) => next.knew.has(t)).length;
      toast.success(`Chapter complete — you recalled ${total} of ${targets.length}!`, { description: total === targets.length ? 'A perfect score. Brilliant!' : 'Reset and go again to lock in the ones you missed.' });
      celebrate();
      return;
    }
    const nextTopic = nodes.find((r) => r.id !== topic.id && [...subtreeIds(r)].some((t) => targetSet.has(t) && !next.knew.has(t) && !next.missed.has(t)));
    toast.success(`${topic.label}: ${recalled}/${cards.length} recalled`, {
      description: recalled === cards.length ? 'Every one — nicely done!' : undefined,
      action: nextTopic ? { label: 'Next topic →', onClick: () => onTopicChip(nextTopic.id) } : undefined,
    });
    if (recalled === cards.length) celebrate();
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
        if (compact) {
          nodeRefs.current.get(id)?.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
          return;
        }
        const n = layoutRef.current.get(id);
        if (n) centreOn(n);
      });
    },
    [search.matches, centreOn, compact],
  );

  // ── Keyboard navigation between nodes ──
  const focusNode = (id: string | undefined) => {
    if (!id) return;
    requestAnimationFrame(() => {
      nodeRefs.current.get(id)?.focus();
      if (compact) return; // focusing scrolls the row into view
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
      // Phones: rows in reading order.
      const column: { id: string }[] = compact ? layout.nodes : entry.siblings.filter((s) => byId.get(s.id)?.side === n.side);
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
    setPrinting(true); // and the full radial map, even from a phone
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
      setPrinting(false);
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

  // ── Keyboard shortcuts: active while focus is in the map, or the map is on screen and
  // nothing else has focus. Never while typing. ──
  const inView = useRef(false);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      inView.current = entry.isIntersecting;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const onShortcut = useRef<(e: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    onShortcut.current = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const active = document.activeElement;
      const within = !!active && !!wrapperRef.current?.contains(active);
      if (!within && !(inView.current && (!active || active === document.body))) return;
      switch (e.key) {
        case '/':
          e.preventDefault();
          if (quiz) exitQuiz();
          requestAnimationFrame(() => searchRef.current?.focus());
          break;
        case 'q':
        case 'Q':
          if (quiz) exitQuiz();
          else if (targets.length) startQuiz();
          break;
        case 'e':
        case 'E':
          expandAll();
          break;
        case 'c':
        case 'C':
          collapseAll();
          break;
        case 'f':
        case 'F':
          void toggleFullscreen();
          break;
        case '0':
          if (!compact) fit();
          break;
        case '+':
        case '=':
          if (!compact) zoomAt(1.25);
          break;
        case '-':
        case '_':
          if (!compact) zoomAt(1 / 1.25);
          break;
        case '?':
          setHelp((h) => !h);
          break;
        case 'Escape':
          if (help) setHelp(false);
          else setSelectedId(null);
          break;
      }
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => onShortcut.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const selected = selectedId ? index.get(selectedId) : undefined;
  const selectedLayout = selectedId ? byId.get(selectedId) : undefined;
  const selectedResources = selectedId ? resources[selectedId] : undefined;
  const exploredCount = useMemo(() => [...explored].filter((id) => index.has(id)).length, [explored, index]);
  const knewCount = targets.filter((id) => quizResults.knew.has(id)).length;
  const missedCount = targets.filter((id) => quizResults.missed.has(id)).length;
  const selectedHidden = selectedId ? isHidden(selectedId) : false;
  const selectedIsQuizCard = !!selectedId && quiz && targetSet.has(selectedId);

  // Per-topic progress: explored nodes normally, recalled cards during a quiz.
  const topicChips = useMemo(
    () =>
      nodes.map((r, i) => {
        if (quiz) {
          const ids = [...subtreeIds(r)].filter((id) => targetSet.has(id));
          return { id: r.id, label: r.label, branch: i, done: ids.filter((id) => quizResults.knew.has(id)).length, total: ids.length };
        }
        return { id: r.id, label: r.label, branch: i, ...subtreeProgress(r, explored) };
      }),
    [nodes, quiz, targetSet, quizResults, explored],
  );
  const topicProgress = new Map(topicChips.map((t) => [t.id, t]));
  const openTopics = nodes.filter((r) => expanded.has(r.id));
  const activeTopicId = openTopics.length === 1 ? openTopics[0].id : null;
  const centreBox = layout.centre ?? { x: -SIZES.center.w / 2, y: -SIZES.center.h / 2, w: SIZES.center.w, h: SIZES.center.h };
  const answeredCount = knewCount + missedCount;
  const showTip = !tipDismissed && !quiz && expanded.size === 0 && !selectedId;
  const coach =
    quiz && expanded.size === 0 && !selectedId
      ? 'Pick a topic, recall its subtopics, then tap each card to check yourself.'
      : showTip
        ? compact
          ? 'Tap a topic to open it — then try Quiz me to test yourself.'
          : 'Click a topic to open its branch — then try Quiz me. Press ? for shortcuts.'
        : null;
  const closeDetails = () => {
    setSelectedId(null);
    setSheetOpen(false);
  };

  const detailsBody = selected && selectedLayout ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {selected.path.length > 0 && <p className="truncate text-[11px] text-muted-foreground">{[title.chapter, ...selected.path].join(' › ')}</p>}
              <h3 className="mt-0.5 flex items-center gap-2 font-semibold text-foreground">
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', colourFor(selectedLayout.branch).dot)} aria-hidden />
                {selectedHidden ? 'What is this?' : selected.node.label}
              </h3>
            </div>
            <button type="button" onClick={closeDetails} aria-label="Close details" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
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
                    'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 font-semibold transition-colors',
                    compact ? 'py-2.5 text-sm' : 'py-1.5 text-xs',
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
                    'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 font-semibold transition-colors',
                    compact ? 'py-2.5 text-sm' : 'py-1.5 text-xs',
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
        </>
      ) : null;

  return (
    <div
      ref={wrapperRef}
      data-mindmap-print-root
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-container-lowest',
        compact ? fullscreen && 'h-screen overflow-y-auto rounded-none' : fullscreen ? 'h-screen rounded-none' : 'h-[min(78vh,720px)] min-h-[480px]',
        className,
      )}
    >
      {/* Print-only heading */}
      <div className="hidden p-4 print:block">
        <p className="text-sm text-gray-600">{title.eyebrow} · {title.subject}</p>
        <p className="text-xl font-bold text-gray-900">{title.chapter} — mind map</p>
      </div>

      {/* Header: search or quiz bar, tools, topic chips */}
      <div data-mindmap-chrome className="relative z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 p-2.5 sm:p-3">
          {quiz ? (
            <div className="flex min-w-0 flex-1 basis-full flex-col gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 sm:max-w-md sm:basis-auto">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Brain className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="text-sm font-semibold text-foreground">Quiz</span>
                <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{knewCount}</span> knew · <span className="font-semibold text-warning">{missedCount}</span> missed · {targets.length} cards
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <button type="button" onClick={revealAll} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-background/60 pointer-coarse:py-2" title="Reveal every card">
                    <Eye className="h-3.5 w-3.5" /> <span className="hidden min-[380px]:inline">Reveal all</span>
                  </button>
                  <button type="button" onClick={resetQuiz} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-background/60 pointer-coarse:py-2" title="Clear your results and start again">
                    <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden min-[380px]:inline">Reset</span>
                  </button>
                  <button type="button" onClick={exitQuiz} className="flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs font-semibold hover:bg-background/80 pointer-coarse:py-2">
                    <X className="h-3.5 w-3.5" /> Exit
                  </button>
                </span>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-background/70" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={targets.length} aria-valuenow={answeredCount}>
                <span className="h-full bg-emerald-500 motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${targets.length ? (knewCount / targets.length) * 100 : 0}%` }} />
                <span className="h-full bg-warning motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${targets.length ? (missedCount / targets.length) * 100 : 0}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 basis-full items-center gap-1 rounded-xl border border-border bg-background px-2 focus-within:border-primary/50 sm:max-w-xs sm:basis-auto">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    goToMatch(matchIndex + (e.shiftKey ? -1 : searching && selectedId === search.matches[matchIndex] ? 1 : 0));
                  } else if (e.key === 'Escape') {
                    onQueryChange('');
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Search this mind map"
                aria-label="Search this mind map"
                className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:h-9"
              />
              {!query && (
                <kbd className="hidden rounded border border-border px-1.5 font-mono text-[10px] text-muted-foreground lg:inline" aria-hidden>
                  /
                </kbd>
              )}
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

          <div className="ml-auto flex items-center gap-1">
            {storageKey && totalNodes > 0 && !quiz && (
              <span className="flex items-center gap-1.5 px-1.5 text-xs text-muted-foreground tabular-nums" title="Topics you've opened on this device">
                <ProgressRing done={exploredCount} total={totalNodes} size={22} label="explored" className="text-primary" />
                <span>
                  {exploredCount}/{totalNodes}
                  <span className="hidden md:inline"> explored</span>
                </span>
              </span>
            )}
            {targets.length > 0 && !quiz && (
              <button
                type="button"
                onClick={startQuiz}
                title="Hide the subtopics and test your recall (Q)"
                className="flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-violet-500 px-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.03] hover:shadow-md active:scale-95 pointer-coarse:h-10"
              >
                <Brain className="h-4 w-4" /> Quiz me
              </button>
            )}
            {!compact && (
              <>
                <ToolButton label="Expand all (E)" onClick={expandAll} icon={<UnfoldVertical className="h-4 w-4" />} text="Expand all" />
                <ToolButton label="Collapse to topics (C)" onClick={collapseAll} icon={<FoldVertical className="h-4 w-4" />} text="Collapse" />
                <ToolButton label="Fit to screen (0)" onClick={fit} icon={<Scan className="h-4 w-4" />} />
                <ToolButton label={fullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'} onClick={toggleFullscreen} icon={fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />} />
                <ToolButton label="Keyboard shortcuts (?)" onClick={() => setHelp((h) => !h)} icon={<Keyboard className="h-4 w-4" />} className="hidden pointer-fine:flex" />
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="More options" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:p-2.5">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {compact && (
                  <>
                    <DropdownMenuItem onSelect={expandAll}>
                      <UnfoldVertical className="h-4 w-4" /> Expand everything
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={collapseAll}>
                      <FoldVertical className="h-4 w-4" /> Collapse to topics
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={toggleFullscreen}>
                      {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />} {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    </DropdownMenuItem>
                  </>
                )}
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
        <TopicChips topics={topicChips} activeId={activeTopicId} onSelect={onTopicChip} progressLabel={quiz ? 'recalled' : 'explored'} />
      </div>

      {/* Map area */}
      <div className={cn('relative', !compact && 'min-h-0 flex-1')}>
        {compact && coach && (
          <div data-mindmap-chrome className="mx-3 mt-3 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="flex-1">{coach}</p>
            {showTip && (
              <button type="button" onClick={dismissTip} aria-label="Dismiss tip" className="-m-1 rounded-md p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div
          ref={viewportRef}
          role={compact ? 'group' : 'application'}
          aria-label={compact ? `${title.chapter} mind map` : `${title.chapter} mind map. Use Tab to move between topics, arrow keys to expand and navigate. Press ? for shortcuts.`}
          className={compact ? 'relative px-3 pt-3 pb-5' : 'absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing'}
          onPointerDown={compact ? undefined : onPointerDown}
          onPointerMove={compact ? undefined : onPointerMove}
          onPointerUp={compact ? undefined : onPointerUp}
          onPointerCancel={compact ? undefined : onPointerUp}
          onDoubleClick={(e) => {
            if (!compact && !(e.target as HTMLElement).closest('[data-node], [data-mindmap-chrome]')) zoomAt(1.4, e.clientX, e.clientY);
          }}
          style={
            compact
              ? undefined
              : {
                  backgroundImage: 'radial-gradient(circle, color-mix(in oklab, var(--border) 80%, transparent) 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }
          }
        >
          <div
            className={compact ? 'relative' : 'absolute top-1/2 left-1/2'}
            style={compact ? { height: layout.bounds.maxY } : { transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.k})`, transformOrigin: '0 0' }}
          >
            {/* Branch lines — each draws itself in when it appears */}
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
                  key={`${compact ? 'v' : 'r'}:${l.id}`}
                  d={l.d}
                  pathLength={1}
                  fill="none"
                  strokeLinecap="round"
                  strokeWidth={l.depth === 1 ? 3 : 2}
                  className={cn('mm-draw', colourFor(l.branch).stroke, l.depth > 1 && 'opacity-60', searching && !matchSet.has(l.id) && 'opacity-20', 'transition-opacity')}
                />
              ))}
            </svg>

            {/* Central node */}
            <div
              className={cn('absolute flex flex-col items-center justify-center rounded-2xl border-2 px-4 text-center shadow-lg', CENTRE_CLASSES)}
              style={{ left: centreBox.x, top: centreBox.y, width: centreBox.w, height: centreBox.h }}
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
            const progress = n.depth === 1 && n.childCount > 0 ? topicProgress.get(n.id) : undefined;
            const showInfo = n.childCount > 0 && !hidden && !!(entry?.node.description || res?.practiceHref || res?.notesHref);
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
                    'relative flex h-full w-full scroll-mt-40 items-center gap-2 rounded-xl text-left shadow-sm transition-[box-shadow,transform,opacity] duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95',
                    n.depth === 1 ? cn('border-2 px-3', colour.topic) : cn('border px-3', colour.sub),
                    colour.ring.replace('ring-', 'focus-visible:ring-'),
                    isSelected && cn('ring-2 ring-offset-2 ring-offset-background', colour.ring),
                    isMatch && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-background',
                    searching && !isMatch && 'opacity-40',
                    hidden && 'border-dashed',
                    compact && n.depth === 1 && 'text-base',
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
                    <span className={cn('line-clamp-2 min-w-0 flex-1 leading-snug', n.depth === 1 ? 'text-sm font-semibold' : 'text-[13px] font-medium', compact && showInfo && 'pr-9')}>{n.label}</span>
                  )}
                  {quizMark === 'knew' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="You knew this" />}
                  {quizMark === 'missed' && <XCircle className="h-4 w-4 shrink-0 text-warning" aria-label="You missed this" />}
                  {progress ? (
                    <ProgressRing done={progress.done} total={progress.total} size={20} label={quiz ? 'recalled' : 'explored'} />
                  ) : (
                    !quiz && explored.has(n.id) && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  )}
                  {n.childCount > 0 && (
                    <span
                      className={cn(
                        'flex h-6 min-w-6 items-center justify-center rounded-full border-2 bg-background px-1 font-mono text-[10px] font-bold text-foreground shadow-sm',
                        compact ? 'shrink-0' : cn('absolute top-1/2 -translate-y-1/2', n.side === 1 ? '-right-3' : '-left-3'),
                        colour.topic.split(' ')[0],
                      )}
                      aria-hidden
                    >
                      {n.expanded ? '−' : `+${n.childCount}`}
                    </span>
                  )}
                </button>

                {/* Phones: branch details behind a small info button (tapping the row opens/closes it). */}
                {compact && showInfo && (
                  <button
                    type="button"
                    onClick={() => {
                      select(n.id);
                      setSheetOpen(true);
                    }}
                    aria-label={`About ${n.label}`}
                    className="absolute top-1/2 right-11 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-current opacity-70 hover:bg-foreground/10 hover:opacity-100"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                )}

                {/* Hover card */}
                {!compact && !hidden && (entry?.node.description || hint) && (
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

        {!compact && (
          <>
            {/* Zoom controls */}
            <div data-mindmap-chrome className="absolute bottom-3 left-3 flex items-center gap-1 rounded-xl border border-border bg-card/95 p-1 shadow-sm backdrop-blur">
              <ToolButton label="Zoom out (−)" onClick={() => zoomAt(1 / 1.25)} icon={<ZoomOut className="h-4 w-4" />} />
              <span className="w-12 text-center text-xs text-muted-foreground tabular-nums" aria-live="polite">
                {Math.round(view.k * 100)}%
              </span>
              <ToolButton label="Zoom in (+)" onClick={() => zoomAt(1.25)} icon={<ZoomIn className="h-4 w-4" />} />
              <ToolButton label="Reset zoom" onClick={() => setView({ k: 1, tx: 0, ty: 0 })} icon={<Crosshair className="h-4 w-4" />} />
              <span className="hidden pr-2 pl-1 text-[11px] text-muted-foreground lg:inline pointer-coarse:lg:hidden">Drag to move · Ctrl + scroll to zoom</span>
              <span className="hidden pr-2 pl-1 text-[11px] text-muted-foreground pointer-coarse:inline">Drag to move · pinch to zoom</span>
            </div>

            {coach && (
              <div data-mindmap-chrome className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center px-3">
                <p className="pointer-events-auto flex items-center gap-2 rounded-full border border-primary/30 bg-card/95 py-2 pr-2 pl-4 text-center text-xs text-foreground shadow-md backdrop-blur motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  {coach}
                  {showTip ? (
                    <button type="button" onClick={dismissTip} aria-label="Dismiss tip" className="rounded-full p-1 text-muted-foreground hover:bg-muted">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="w-2" />
                  )}
                </p>
              </div>
            )}

            {/* Details panel for the selected node */}
            {detailsBody && (
              <aside
                data-mindmap-chrome
                aria-label={`${selected!.node.label} details`}
                className="absolute right-3 bottom-3 max-h-[calc(100%-1.5rem)] w-80 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl motion-safe:animate-in motion-safe:slide-in-from-bottom-2"
              >
                {detailsBody}
              </aside>
            )}
          </>
        )}
      </div>

      {/* Phones: details as a bottom sheet */}
      {compact && sheetOpen && detailsBody && (
        <>
          <div data-mindmap-chrome className="fixed inset-0 z-40 bg-black/30 motion-safe:animate-in motion-safe:fade-in" onClick={closeDetails} aria-hidden />
          <aside
            data-mindmap-chrome
            role="dialog"
            aria-label={`${selected!.node.label} details`}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" aria-hidden />
            {detailsBody}
          </aside>
        </>
      )}

      {/* Keyboard shortcuts */}
      {help && (
        <div data-mindmap-chrome className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setHelp(false)}>
          <div role="dialog" aria-label="Keyboard shortcuts" className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl motion-safe:animate-in motion-safe:zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <Keyboard className="h-4 w-4 text-primary" aria-hidden /> Keyboard shortcuts
              </p>
              <button type="button" onClick={() => setHelp(false)} aria-label="Close shortcuts" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-sm">
              {SHORTCUTS.map(([keys, action]) => (
                <Fragment key={keys}>
                  <dt>
                    <kbd className="inline-block min-w-8 rounded-md border border-b-2 border-border bg-muted px-2 py-0.5 text-center font-mono text-xs text-foreground">{keys}</kbd>
                  </dt>
                  <dd className="text-muted-foreground">{action}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </div>
      )}

      {confetti !== null && <Confetti key={confetti} />}
    </div>
  );
}

function ToolButton({ label, onClick, icon, text, className }: { label: string; onClick: () => void; icon: React.ReactNode; text?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn('flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:p-2.5', className)}
    >
      {icon}
      {text && <span className="hidden text-xs font-medium xl:inline">{text}</span>}
    </button>
  );
}
