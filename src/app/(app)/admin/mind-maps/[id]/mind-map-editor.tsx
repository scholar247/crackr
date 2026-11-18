'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  CircleCheck,
  Download,
  Eye,
  FileUp,
  GripVertical,
  History,
  Keyboard,
  Redo2,
  RotateCcw,
  Undo2,
  ExternalLink,
  IndentDecrease,
  IndentIncrease,
  Link2,
  ListPlus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MindMap } from '@/components/mind-map/mind-map';
import { colourFor } from '@/components/mind-map/palette';
import { cn, formatDate } from '@/lib/utils';
import {
  MIND_MAP_STATUS_LABELS,
  allowedMindMapActions,
  buildTree,
  countNodes,
  diffMindMaps,
  flattenTree,
  generateFromCurriculum,
  missingCurriculumItems,
  walkTree,
  type CurriculumSource,
  type FlatMindMapNode,
  type MindMapAction,
  type MindMapFaq,
  type MindMapStatus,
  type MindMapTheme,
  type MindMapTreeNode,
  MIND_MAP_LIMITS,
} from '@/lib/mind-maps';
import {
  addChild,
  addMissingCurriculum,
  indentNode,
  insertSiblingAfter,
  moveNode,
  moveNodeTo,
  newNode,
  outdentNode,
  outlineOrder,
  removeNode,
  updateNode,
} from '@/lib/mind-map-tree-ops';
import { importOutline, toMarkdownOutline, type ImportResult } from '@/lib/mind-map-import';
import { STATUS_BADGE } from '../mind-maps-client';

interface EditorData {
  map: {
    id: string;
    status: MindMapStatus;
    seoTitle: string | null;
    seoDescription: string | null;
    intro: string | null;
    revisionNotes: string | null;
    faqs: MindMapFaq[] | null;
    theme: MindMapTheme;
    publishedAt: string | null;
    updatedAt: string;
  };
  exam: { id: string; name: string; slug: string };
  subject: { id: string; name: string; slug: string } | null;
  chapter: { id: string; name: string; slug: string } | null;
  curriculum: CurriculumSource | null;
  nodes: FlatMindMapNode[];
  publishedNodes: MindMapTreeNode[] | null;
  publicPath: string | null;
  versions: { id: string; version: number; nodeCount: number | null; publishedAt: string; publishedBy: string | null }[];
}

type Tree = MindMapTreeNode[];
type DropPosition = 'before' | 'after' | 'inside';

/** Row-level operations shared by every TreeRows level. */
interface RowOps {
  disabled: boolean;
  openRow: string | null;
  setOpenRow: (id: string | null) => void;
  options: { id: string; name: string; depth: number }[];
  optionName: Map<string, string>;
  onChange: (fn: (tree: Tree) => Tree, coalesce?: string) => void;
  onKey: (e: React.KeyboardEvent<HTMLInputElement>, n: MindMapTreeNode, depth: number, index: number) => void;
  drag: { id: string | null; over: { id: string; pos: DropPosition } | null };
  setDrag: (d: { id: string | null; over: { id: string; pos: DropPosition } | null }) => void;
  onDrop: () => void;
}

const HISTORY_LIMIT = 100;
const focusRow = (id: string | undefined) => {
  if (!id) return;
  requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-row-input="${id}"]`)?.focus());
};

interface Fields {
  seoTitle: string;
  seoDescription: string;
  intro: string;
  revisionNotes: string;
  faqs: MindMapFaq[];
  theme: MindMapTheme;
}

const ACTION_LABELS: Record<MindMapAction, string> = {
  submit: 'Submit for review',
  return: 'Return to draft',
  publish: 'Publish',
  unpublish: 'Unpublish',
  archive: 'Archive',
  restore: 'Restore',
};

async function api<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as T;
}

function fieldsFrom(map: EditorData['map']): Fields {
  return { seoTitle: map.seoTitle ?? '', seoDescription: map.seoDescription ?? '', intro: map.intro ?? '', revisionNotes: map.revisionNotes ?? '', faqs: map.faqs ?? [], theme: map.theme ?? 'COLOUR' };
}

/** Curriculum items flattened with depth, for the "linked topic" picker. */
function curriculumOptions(chapter: CurriculumSource | null) {
  const out: { id: string; name: string; depth: number }[] = [];
  const visit = (n: CurriculumSource, depth: number) => {
    out.push({ id: n.id, name: n.name, depth });
    n.children.forEach((c) => visit(c, depth + 1));
  };
  chapter?.children.forEach((c) => visit(c, 0));
  return out;
}

export function MindMapEditor({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-mind-map', id], queryFn: () => api<{ data: EditorData }>(`/api/v1/admin/mind-maps/${id}`).then((r) => r.data) });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error || !data) return <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Could not load this mind map'}</p>;
  // Keyed on updatedAt so a save/publish (new server state) resets local edits cleanly.
  return <EditorBody key={data.map.updatedAt + data.map.status} data={data} onSaved={(next) => qc.setQueryData(['admin-mind-map', id], next)} onReload={() => qc.invalidateQueries({ queryKey: ['admin-mind-map', id] })} />;
}

function EditorBody({ data, onSaved, onReload }: { data: EditorData; onSaved: (d: EditorData) => void; onReload: () => void }) {
  const qc = useQueryClient();
  const [tree, setTree] = useState<MindMapTreeNode[]>(() => buildTree(data.nodes));
  const [fields, setFields] = useState<Fields>(() => fieldsFrom(data.map));
  const [dirty, setDirty] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const status = data.map.status;
  const archived = status === 'ARCHIVED';
  const options = useMemo(() => curriculumOptions(data.curriculum), [data.curriculum]);
  const optionName = useMemo(() => new Map(options.map((o) => [o.id, o.name])), [options]);
  const missing = useMemo(() => (data.curriculum ? missingCurriculumItems(data.curriculum, tree) : []), [data.curriculum, tree]);
  const diff = useMemo(() => diffMindMaps(data.publishedNodes, tree), [data.publishedNodes, tree]);

  // Undo / redo over the whole tree. Typing in one field is merged into a single step.
  const [past, setPast] = useState<Tree[]>([]);
  const [future, setFuture] = useState<Tree[]>([]);
  const lastEdit = useRef<{ key: string; at: number } | null>(null);
  const edit = (next: Tree, coalesce?: string) => {
    const at = Date.now();
    const merge = !!coalesce && lastEdit.current?.key === coalesce && at - lastEdit.current.at < 1500;
    lastEdit.current = coalesce ? { key: coalesce, at } : null;
    if (!merge) setPast((p) => [...p.slice(-HISTORY_LIMIT + 1), tree]);
    setFuture([]);
    setTree(next);
    setDirty(true);
  };
  const undo = () => {
    if (past.length === 0) return;
    setFuture((f) => [tree, ...f]);
    setTree(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    lastEdit.current = null;
    setDirty(true);
  };
  const redo = () => {
    if (future.length === 0) return;
    setPast((p) => [...p, tree]);
    setTree(future[0]);
    setFuture((f) => f.slice(1));
    lastEdit.current = null;
    setDirty(true);
  };
  const historyKeys = useRef({ undo, redo, archived: false });
  useEffect(() => {
    historyKeys.current = { undo, redo, archived: status === 'ARCHIVED' };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || historyKeys.current.archived) return;
      // Leave native undo to long-form text fields (descriptions, notes, FAQs).
      if (e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        historyKeys.current.undo();
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        historyKeys.current.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Drag & drop between rows.
  const [drag, setDrag] = useState<{ id: string | null; over: { id: string; pos: DropPosition } | null }>({ id: null, over: null });
  const onDrop = () => {
    if (drag.id && drag.over) edit(moveNodeTo(tree, drag.id, drag.over.id, drag.over.pos));
    setDrag({ id: null, over: null });
  };

  /** Outline keyboard: Enter new point, Tab / Shift+Tab nest, Alt+↑↓ reorder, ↑↓ move focus. */
  const onRowKey = (e: React.KeyboardEvent<HTMLInputElement>, n: MindMapTreeNode, depth: number, index: number) => {
    const order = outlineOrder(tree);
    const at = order.indexOf(n.id);
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const fresh = newNode('');
      edit(e.ctrlKey || e.metaKey ? addChild(tree, n.id, fresh) : insertSiblingAfter(tree, n.id, fresh));
      focusRow(fresh.id);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey ? depth > 0 : index > 0) edit(e.shiftKey ? outdentNode(tree, n.id) : indentNode(tree, n.id));
      focusRow(n.id);
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      edit(moveNode(tree, n.id, e.key === 'ArrowUp' ? -1 : 1));
      focusRow(n.id);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusRow(order[at + (e.key === 'ArrowUp' ? -1 : 1)]);
    } else if (e.key === 'Backspace' && n.label === '' && n.children.length === 0) {
      e.preventDefault();
      edit(removeNode(tree, n.id));
      focusRow(order[at - 1] ?? order[at + 1]);
    }
  };

  // Import an outline (Markdown, indented text, OPML).
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const importPreview: ImportResult | null = useMemo(() => (importText.trim() ? importOutline(importText) : null), [importText]);
  const applyImport = (mode: 'replace' | 'append') => {
    if (!importPreview || importPreview.count === 0) return;
    if (mode === 'replace' && tree.length > 0 && !confirm('Replace the whole map with the imported outline? You can undo this.')) return;
    edit(mode === 'replace' ? importPreview.nodes : [...tree, ...importPreview.nodes]);
    toast.success(`Imported ${importPreview.count} node${importPreview.count === 1 ? '' : 's'}${importPreview.truncated ? ` (${importPreview.truncated} long labels shortened)` : ''}. Imported nodes are custom — check them against the syllabus.`);
    setImporting(false);
    setImportText('');
  };
  const downloadOutline = () => {
    const blob = new Blob([toMarkdownOutline(data.chapter?.name ?? 'Mind map', tree)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.chapter?.slug ?? 'mind-map'}-outline.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Version history: restore a published version into the draft.
  const [previewVersion, setPreviewVersion] = useState<{ version: number; nodes: Tree; publishedAt: string } | null>(null);
  const loadVersion = async (versionId: string) => {
    const res = await api<{ data: { version: number; snapshot: { nodes: Tree; seoTitle: string | null; seoDescription: string | null; intro: string | null; revisionNotes: string | null; faqs: MindMapFaq[]; theme?: MindMapTheme }; publishedAt: string } }>(
      `/api/v1/admin/mind-maps/${data.map.id}/versions/${versionId}`,
    );
    return res.data;
  };
  const restoreVersion = async (versionId: string) => {
    try {
      const v = await loadVersion(versionId);
      if (!confirm(`Replace the draft with version ${v.version}? The live page doesn't change until you publish. You can undo this.`)) return;
      edit(v.snapshot.nodes);
      setFields({
        seoTitle: v.snapshot.seoTitle ?? '',
        seoDescription: v.snapshot.seoDescription ?? '',
        intro: v.snapshot.intro ?? '',
        revisionNotes: v.snapshot.revisionNotes ?? '',
        faqs: v.snapshot.faqs ?? [],
        theme: v.snapshot.theme ?? 'COLOUR',
      });
      toast.success(`Version ${v.version} restored into the draft — review and publish when ready.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const setField = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setFields((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const payload = () => ({
    seoTitle: fields.seoTitle || null,
    seoDescription: fields.seoDescription || null,
    intro: fields.intro || null,
    revisionNotes: fields.revisionNotes || null,
    faqs: fields.faqs.filter((f) => f.question.trim() && f.answer.trim()),
    nodes: flattenTree(tree),
    theme: fields.theme,
  });

  const save = useMutation({
    mutationFn: () => api<{ data: EditorData }>(`/api/v1/admin/mind-maps/${data.map.id}`, 'PUT', payload()),
    onSuccess: (res) => {
      toast.success('Draft saved');
      setDirty(false);
      onSaved(res.data);
      qc.invalidateQueries({ queryKey: ['admin-mind-maps'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const act = useMutation({
    mutationFn: async (action: MindMapAction) => {
      // Never publish/submit stale content: save pending edits first.
      if (dirty && !archived) await api(`/api/v1/admin/mind-maps/${data.map.id}`, 'PUT', payload());
      return api(`/api/v1/admin/mind-maps/${data.map.id}/status`, 'POST', { action });
    },
    onSuccess: (_r, action) => {
      toast.success(action === 'publish' ? 'Published — the public page is updated' : `${ACTION_LABELS[action]}: done`);
      setDirty(false);
      onReload();
      qc.invalidateQueries({ queryKey: ['admin-mind-maps'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regenerate = () => {
    if (!data.curriculum) return;
    if (!confirm('Replace the whole structure with a fresh copy of the curriculum? Custom nodes, descriptions and content on nodes will be lost.')) return;
    edit(generateFromCurriculum(data.curriculum));
  };

  const addMissing = () => {
    if (!data.curriculum) return;
    const { tree: next, added } = addMissingCurriculum(tree, data.curriculum);
    edit(next);
    toast.success(`Added ${added} curriculum item${added === 1 ? '' : 's'}`);
  };

  // Review checklist
  let custom = 0;
  let withContent = 0;
  let withoutDescription = 0;
  walkTree(tree, (n) => {
    if (!n.curriculumNodeId) custom++;
    if (n.content || (n.description && !n.curriculumNodeId)) withContent++;
    if (!n.description) withoutDescription++;
  });
  const total = countNodes(tree);
  const title = { eyebrow: data.exam.name.replace(/ Board$/, ''), subject: data.subject?.name ?? '', chapter: data.chapter?.name ?? 'Chapter' };
  const pending = status === 'PUBLISHED' && (diff.hasChanges || dirty);

  return (
    <div>
      {/* Header */}
      <Link href="/admin/mind-maps" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All mind maps
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">{data.chapter?.name ?? 'Unknown chapter'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.exam.name}
            {data.subject ? ` · ${data.subject.name}` : ''} · {total} nodes · {data.map.publishedAt ? `last published ${formatDate(data.map.publishedAt)}` : 'never published'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={STATUS_BADGE[status]}>{MIND_MAP_STATUS_LABELS[status]}</Badge>
            {pending && <Badge variant="warning">Changes not yet live</Badge>}
            {dirty && <Badge variant="outline">Unsaved</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.publicPath && status === 'PUBLISHED' && (
            <Button variant="outline" size="sm" asChild>
              <a href={data.publicPath} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> View live
              </a>
            </Button>
          )}
          {!archived && (
            <div className="flex items-center rounded-md border border-border">
              <Button variant="ghost" size="sm" onClick={undo} disabled={past.length === 0} aria-label="Undo (Ctrl+Z)" title="Undo (Ctrl+Z)" className="rounded-r-none">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={redo} disabled={future.length === 0} aria-label="Redo (Ctrl+Shift+Z)" title="Redo (Ctrl+Shift+Z)" className="rounded-l-none">
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!archived && (
            <Button variant="outline" size="sm" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
              <Save className="h-4 w-4" /> {save.isPending ? 'Saving…' : 'Save draft'}
            </Button>
          )}
          {allowedMindMapActions(status)
            .filter((a) => !(a === 'publish' && status === 'PUBLISHED' && !pending))
            .map((a) => (
              <Button
                key={a}
                size="sm"
                variant={a === 'publish' ? 'default' : a === 'archive' || a === 'unpublish' ? 'ghost' : 'secondary'}
                disabled={act.isPending}
                onClick={() => {
                  if ((a === 'unpublish' || a === 'archive') && !confirm(`${ACTION_LABELS[a]} this mind map? It will disappear from the site.`)) return;
                  act.mutate(a);
                }}
              >
                {a === 'publish' && status === 'PUBLISHED' ? 'Publish changes' : ACTION_LABELS[a]}
              </Button>
            ))}
        </div>
      </div>

      {archived && <p className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">This mind map is archived. Restore it to edit or publish again.</p>}

      <Tabs defaultValue="structure" className="mt-6">
        <TabsList>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="content">Content &amp; SEO</TabsTrigger>
          <TabsTrigger value="review">
            Review
            {diff.hasChanges && <span className="ml-1.5 h-2 w-2 rounded-full bg-warning" aria-label="has changes" />}
          </TabsTrigger>
          <TabsTrigger value="history">History ({data.versions.length})</TabsTrigger>
        </TabsList>

        {/* ── Structure ── */}
        <TabsContent value="structure" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={archived} onClick={() => edit(addChild(tree, null, newNode('New topic')))}>
                  <Plus className="h-4 w-4" /> Add topic
                </Button>
                <Button size="sm" variant="outline" disabled={archived || missing.length === 0} onClick={addMissing}>
                  <ListPlus className="h-4 w-4" /> Add missing curriculum items ({missing.length})
                </Button>
                <Button size="sm" variant="ghost" disabled={archived || !data.curriculum} onClick={regenerate}>
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </Button>
                <Button size="sm" variant="ghost" disabled={archived} onClick={() => setImporting(true)}>
                  <FileUp className="h-4 w-4" /> Import outline
                </Button>
                <Button size="sm" variant="ghost" disabled={tree.length === 0} onClick={downloadOutline}>
                  <Download className="h-4 w-4" /> Export outline
                </Button>
              </div>

              <div className="mt-3 rounded-xl border border-border bg-card">
                {tree.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No nodes yet. Add a topic, or pull topics from the curriculum.</p>
                ) : (
                  <TreeRows
                    nodes={tree}
                    depth={0}
                    branch={null}
                    ops={{
                      disabled: archived,
                      openRow,
                      setOpenRow,
                      options,
                      optionName,
                      onChange: (fn, coalesce) => edit(fn(tree), coalesce),
                      onKey: onRowKey,
                      drag,
                      setDrag,
                      onDrop,
                    }}
                  />
                )}
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Keyboard className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>
                  Type like an outline: <kbd>Enter</kbd> new point · <kbd>Ctrl+Enter</kbd> child · <kbd>Tab</kbd>/<kbd>Shift+Tab</kbd> nest · <kbd>Alt+↑↓</kbd> reorder · <kbd>↑↓</kbd> move ·{' '}
                  <kbd>Backspace</kbd> on an empty point deletes it · <kbd>Ctrl+Z</kbd> undo. Drag rows by the handle to move whole branches. Custom nodes (no linked topic) are flagged for review.
                </span>
              </p>
            </div>

            <div className="xl:sticky xl:top-20 xl:self-start">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Live preview</p>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Default style
                  <select
                    value={fields.theme}
                    disabled={archived}
                    onChange={(e) => setField('theme', e.target.value as MindMapTheme)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                  >
                    <option value="COLOUR">Colour branches</option>
                    <option value="CLASSIC">Classic print (monochrome)</option>
                  </select>
                </label>
              </div>
              {/* Keyed by theme so switching the default re-applies it to the preview. */}
              {tree.length > 0 ? <MindMap key={fields.theme} title={title} nodes={tree} theme={fields.theme} className="h-[560px] min-h-0" /> : <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">Nothing to preview yet</div>}
            </div>
          </div>
        </TabsContent>

        {/* ── Content & SEO ── */}
        <TabsContent value="content" className="mt-4 max-w-3xl space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="mm-seo-title">SEO title</Label>
            <Input id="mm-seo-title" value={fields.seoTitle} disabled={archived} onChange={(e) => setField('seoTitle', e.target.value)} maxLength={200} placeholder={`${title.eyebrow} ${title.subject} ${title.chapter} Mind Map`} />
            <p className="text-xs text-muted-foreground">{fields.seoTitle.length}/60 recommended · leave blank to use the default shown.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mm-seo-desc">Meta description</Label>
            <Textarea id="mm-seo-desc" value={fields.seoDescription} disabled={archived} onChange={(e) => setField('seoDescription', e.target.value)} maxLength={320} rows={2} placeholder="Generated from the chapter's topics when blank." />
            <p className={cn('text-xs', fields.seoDescription.length > 160 ? 'text-warning' : 'text-muted-foreground')}>{fields.seoDescription.length}/160 recommended</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mm-intro">Chapter introduction</Label>
            <Textarea id="mm-intro" value={fields.intro} disabled={archived} onChange={(e) => setField('intro', e.target.value)} maxLength={2000} rows={3} placeholder="Shown under the page title. When blank, a summary listing the chapter's topics is used." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mm-revision">Quick revision notes (Markdown)</Label>
            <Textarea
              id="mm-revision"
              value={fields.revisionNotes}
              disabled={archived}
              onChange={(e) => setField('revisionNotes', e.target.value)}
              rows={8}
              className="font-mono text-sm"
              placeholder={'## Key definitions\n- …\n\n## Formulas\n- $E = mc^2$'}
            />
            <p className="text-xs text-muted-foreground">Definitions, formulas and key facts. Verify against NCERT before publishing — only published text appears on the site.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>FAQs</Label>
              <Button size="sm" variant="ghost" disabled={archived || fields.faqs.length >= 20} onClick={() => setField('faqs', [...fields.faqs, { question: '', answer: '' }])}>
                <Plus className="h-4 w-4" /> Add FAQ
              </Button>
            </div>
            {fields.faqs.length === 0 && <p className="text-xs text-muted-foreground">Two FAQs built from the chapter&apos;s topics are always shown; add chapter-specific ones here.</p>}
            {fields.faqs.map((f, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex gap-2">
                  <Input
                    value={f.question}
                    disabled={archived}
                    placeholder="Question"
                    onChange={(e) => setField('faqs', fields.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
                  />
                  <Button size="icon" variant="ghost" aria-label="Remove FAQ" disabled={archived} onClick={() => setField('faqs', fields.faqs.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Textarea value={f.answer} disabled={archived} rows={2} placeholder="Answer" onChange={(e) => setField('faqs', fields.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Review ── */}
        <TabsContent value="review" className="mt-4 grid max-w-5xl gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-semibold text-foreground">{data.publishedNodes ? 'Changes since last publish' : 'Not published yet'}</p>
            {!data.publishedNodes ? (
              <p className="mt-2 text-sm text-muted-foreground">Everything in this draft will go live when you publish.</p>
            ) : !diff.hasChanges ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <CircleCheck className="h-4 w-4 text-secondary" /> The structure matches the live version.
              </p>
            ) : (
              <dl className="mt-3 space-y-3 text-sm">
                {(
                  [
                    ['Added', diff.added],
                    ['Removed', diff.removed],
                    ['Renamed', diff.renamed.map((r) => `${r.from} → ${r.to}`)],
                    ['Moved', diff.moved],
                    ['Description changed', diff.descriptionsChanged],
                    ['Content changed', diff.contentChanged],
                    ['Hindi / style / tags changed', diff.formattingChanged],
                  ] as const
                )
                  .filter(([, items]) => items.length > 0)
                  .map(([label, items]) => (
                    <div key={label}>
                      <dt className="font-medium text-foreground">
                        {label} ({items.length})
                      </dt>
                      <dd className="mt-1 text-muted-foreground">{items.slice(0, 12).join(', ')}{items.length > 12 ? ` and ${items.length - 12} more` : ''}</dd>
                    </div>
                  ))}
              </dl>
            )}
            <p className="mt-4 text-xs text-muted-foreground">SEO, intro, revision notes and FAQs are compared on publish; save to include unsaved edits.</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-semibold text-foreground">Editorial checklist</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <ChecklistItem ok={total > 0} text={total > 0 ? `${total} nodes, ${tree.length} main topics` : 'Add at least one topic (required to publish)'} />
              <ChecklistItem ok={missing.length === 0} warn text={missing.length === 0 ? 'Covers every curriculum topic and subtopic' : `${missing.length} curriculum items not in the map`} />
              <ChecklistItem ok={custom === 0} warn text={custom === 0 ? 'Every node is linked to the curriculum' : `${custom} custom node${custom === 1 ? '' : 's'} — check names against the syllabus`} />
              <ChecklistItem ok={withContent === 0} warn text={withContent === 0 ? 'No editor-written content to fact-check' : `${withContent} node${withContent === 1 ? '' : 's'} with editor-written text — verify against NCERT`} />
              <ChecklistItem ok={!fields.revisionNotes} warn text={fields.revisionNotes ? 'Quick revision notes written — verify formulas and definitions' : 'No revision notes (section hidden on the page)'} />
              <ChecklistItem ok={!!fields.seoTitle && !!fields.seoDescription} warn text={fields.seoTitle && fields.seoDescription ? 'Custom SEO title and description set' : 'Using generated SEO title/description'} />
              <ChecklistItem ok warn text={`${withoutDescription} node${withoutDescription === 1 ? '' : 's'} without a description (optional)`} />
            </ul>
          </div>
        </TabsContent>
        {/* ── History ── */}
        <TabsContent value="history" className="mt-4 max-w-3xl">
          {data.versions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No published versions yet. Each time you publish, a version is saved here.</p>
          ) : (
            <ol className="divide-y divide-border rounded-xl border border-border bg-card">
              {data.versions.map((v, i) => (
                <li key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <History className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      Version {v.version} {i === 0 && <Badge variant="secondary">Live</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(v.publishedAt)}
                      {v.publishedBy ? ` · ${v.publishedBy}` : ''}
                      {v.nodeCount !== null ? ` · ${v.nodeCount} nodes` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        const full = await loadVersion(v.id);
                        setPreviewVersion({ version: full.version, nodes: full.snapshot.nodes, publishedAt: full.publishedAt });
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    <Eye className="h-4 w-4" /> Preview
                  </Button>
                  <Button size="sm" variant="outline" disabled={archived} onClick={() => restoreVersion(v.id)}>
                    <RotateCcw className="h-4 w-4" /> Restore into draft
                  </Button>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Restoring replaces the draft only (undoable). The live page changes when you publish again.</p>
        </TabsContent>
      </Tabs>

      <Dialog open={importing} onOpenChange={setImporting}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import an outline</DialogTitle>
            <DialogDescription>Paste Markdown bullets or headings, indented text, or OPML exported from XMind, MindNode, Workflowy and others — or choose a file.</DialogDescription>
          </DialogHeader>
          <input
            type="file"
            accept=".md,.markdown,.txt,.opml,.xml,text/plain,text/markdown"
            className="text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setImportText(await file.text());
            }}
          />
          <Textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={12} className="font-mono text-xs" placeholder={'# Vice-President\n- Article 63\n  - There shall be a Vice-President of India\n- Article 66\n  - Election of Vice-President'} />
          {importPreview && (
            <p className="text-sm text-muted-foreground">
              {importPreview.count} nodes · {importPreview.nodes.length} main topics · detected {importPreview.format.toUpperCase()}
              {importPreview.truncated ? ` · ${importPreview.truncated} long labels will be shortened` : ''}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={!importPreview?.count} onClick={() => applyImport('append')}>
              Add as new topics
            </Button>
            <Button disabled={!importPreview?.count} onClick={() => applyImport('replace')}>
              Replace map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewVersion} onOpenChange={(o) => !o && setPreviewVersion(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Version {previewVersion?.version}</DialogTitle>
            <DialogDescription>Published {previewVersion ? formatDate(previewVersion.publishedAt) : ''}</DialogDescription>
          </DialogHeader>
          {previewVersion && <MindMap title={title} nodes={previewVersion.nodes} className="h-[60vh] min-h-0" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChecklistItem({ ok, warn, text }: { ok: boolean; warn?: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /> : <AlertTriangle className={cn('mt-0.5 h-4 w-4 shrink-0', warn ? 'text-warning' : 'text-destructive')} />}
      <span className="text-muted-foreground">{text}</span>
    </li>
  );
}

function TreeRows({ nodes, depth, branch, ops }: { nodes: Tree; depth: number; branch: number | null; ops: RowOps }) {
  const { disabled, openRow, setOpenRow, optionName, drag } = ops;
  return (
    <ul className={cn(depth === 0 ? 'divide-y divide-border' : '')}>
      {nodes.map((n, i) => {
        const b = branch ?? i;
        const open = openRow === n.id;
        const over = drag.over?.id === n.id ? drag.over.pos : null;
        return (
          <li key={n.id} className={cn(drag.id === n.id && 'opacity-40')}>
            <div
              className={cn(
                'relative flex items-center gap-1.5 py-1.5 pr-2',
                over === 'inside' && 'bg-primary/10 ring-1 ring-primary/40 ring-inset',
                over === 'before' && 'before:absolute before:inset-x-2 before:top-0 before:h-0.5 before:rounded before:bg-primary',
                over === 'after' && 'after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded after:bg-primary',
              )}
              style={{ paddingLeft: 4 + depth * 20 }}
              onDragOver={(e) => {
                if (!drag.id || drag.id === n.id) return;
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                const y = (e.clientY - r.top) / r.height;
                const pos: DropPosition = y < 0.28 ? 'before' : y > 0.72 ? 'after' : 'inside';
                if (drag.over?.id !== n.id || drag.over.pos !== pos) ops.setDrag({ ...drag, over: { id: n.id, pos } });
              }}
              onDrop={(e) => {
                e.preventDefault();
                ops.onDrop();
              }}
            >
              <span
                draggable={!disabled}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', n.label);
                  ops.setDrag({ id: n.id, over: null });
                }}
                onDragEnd={() => ops.setDrag({ id: null, over: null })}
                className={cn('rounded p-0.5 text-muted-foreground/60', disabled ? 'cursor-not-allowed' : 'cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing')}
                title="Drag to move (with its sub-points)"
                aria-hidden
              >
                <GripVertical className="h-4 w-4" />
              </span>
              <button type="button" onClick={() => setOpenRow(open ? null : n.id)} aria-label={open ? 'Hide details' : 'Edit details'} aria-expanded={open} className="rounded p-1 text-muted-foreground hover:bg-muted">
                <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
              </button>
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', colourFor(b).dot)} aria-hidden />
              <Input
                data-row-input={n.id}
                value={n.label}
                disabled={disabled}
                maxLength={MIND_MAP_LIMITS.label}
                placeholder="Type a point…"
                onChange={(e) => ops.onChange((t) => updateNode(t, n.id, { label: e.target.value }), `label:${n.id}`)}
                onKeyDown={(e) => ops.onKey(e, n, depth, i)}
                aria-label="Node label"
                className={cn('h-8 min-w-0 flex-1', depth === 0 && 'font-semibold')}
              />
              {n.curriculumNodeId ? (
                <span className="hidden shrink-0 items-center gap-1 text-[11px] text-secondary sm:flex" title={`Linked to ${optionName.get(n.curriculumNodeId) ?? 'a removed topic'}`}>
                  <Link2 className="h-3 w-3" /> linked
                </span>
              ) : (
                <Badge variant="warning" className="hidden shrink-0 sm:inline-flex">
                  Custom
                </Badge>
              )}
              <div className="flex shrink-0 items-center">
                <IconAction label="Move up (Alt+↑)" disabled={disabled || i === 0} onClick={() => ops.onChange((t) => moveNode(t, n.id, -1))} icon={<ArrowUp className="h-3.5 w-3.5" />} />
                <IconAction label="Move down (Alt+↓)" disabled={disabled || i === nodes.length - 1} onClick={() => ops.onChange((t) => moveNode(t, n.id, 1))} icon={<ArrowDown className="h-3.5 w-3.5" />} />
                <IconAction label="Outdent (Shift+Tab)" disabled={disabled || depth === 0} onClick={() => ops.onChange((t) => outdentNode(t, n.id))} icon={<IndentDecrease className="h-3.5 w-3.5" />} />
                <IconAction label="Indent (Tab)" disabled={disabled || i === 0} onClick={() => ops.onChange((t) => indentNode(t, n.id))} icon={<IndentIncrease className="h-3.5 w-3.5" />} />
                <IconAction label="Add child (Ctrl+Enter)" disabled={disabled} onClick={() => ops.onChange((t) => addChild(t, n.id, newNode('New subtopic')))} icon={<Plus className="h-3.5 w-3.5" />} />
                <IconAction
                  label="Delete"
                  disabled={disabled}
                  onClick={() => {
                    if (n.children.length === 0 || confirm(`Delete "${n.label}" and its ${countNodes(n.children)} child nodes?`)) ops.onChange((t) => removeNode(t, n.id));
                  }}
                  icon={<Trash2 className="h-3.5 w-3.5 text-destructive" />}
                />
              </div>
            </div>

            {open && (
              <div className="space-y-3 border-y border-border bg-muted/30 py-3 pr-3" style={{ paddingLeft: 40 + depth * 20 }}>
                <div className="space-y-1">
                  <Label className="text-xs">Linked curriculum topic</Label>
                  <select
                    value={n.curriculumNodeId ?? ''}
                    disabled={ops.disabled}
                    onChange={(e) => ops.onChange((t) => updateNode(t, n.id, { curriculumNodeId: e.target.value || null }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">— Custom node (not in curriculum) —</option>
                    {ops.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {'  '.repeat(o.depth)}
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hindi label (shown when the reader switches to हिं)</Label>
                  <Input value={n.labelHi ?? ''} disabled={ops.disabled} maxLength={MIND_MAP_LIMITS.label} lang="hi" onChange={(e) => ops.onChange((t) => updateNode(t, n.id, { labelHi: e.target.value || null }), `hi:${n.id}`)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Style</Label>
                    <select
                      value={n.style?.heading ? 'heading' : (n.style?.border ?? 'normal')}
                      disabled={ops.disabled}
                      onChange={(e) => {
                        const v = e.target.value;
                        const style = { ...(n.style ?? {}), heading: v === 'heading' || undefined, border: v === 'dashed' || v === 'dotted' ? (v as 'dashed' | 'dotted') : undefined };
                        ops.onChange((t) => updateNode(t, n.id, { style }));
                      }}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="normal">Normal box</option>
                      <option value="heading">Heading (title for the facts after it)</option>
                      <option value="dashed">Dashed border (sub-list, e.g. eligibility)</option>
                      <option value="dotted">Dotted border</option>
                    </select>
                    <label className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={!!n.style?.highlight}
                        disabled={ops.disabled}
                        onChange={(e) => ops.onChange((t) => updateNode(t, n.id, { style: { ...(n.style ?? {}), highlight: e.target.checked || undefined } }))}
                      />
                      Highlight (marker pen)
                    </label>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tags (comma separated, max {MIND_MAP_LIMITS.tags})</Label>
                    <Input
                      defaultValue={(n.tags ?? []).join(', ')}
                      disabled={ops.disabled}
                      placeholder="PYQ 2023, Important"
                      onBlur={(e) =>
                        ops.onChange((t) =>
                          updateNode(t, n.id, {
                            tags: e.target.value
                              .split(',')
                              .map((x) => x.trim().slice(0, MIND_MAP_LIMITS.tag))
                              .filter(Boolean)
                              .slice(0, MIND_MAP_LIMITS.tags),
                          }),
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Short description (hover card, topic list)</Label>
                  <Textarea value={n.description ?? ''} disabled={ops.disabled} maxLength={500} rows={2} onChange={(e) => ops.onChange((t) => updateNode(t, n.id, { description: e.target.value || null }), `desc:${n.id}`)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Learning content — definitions, formulas (Markdown, optional)</Label>
                  <Textarea value={n.content ?? ''} disabled={ops.disabled} rows={4} className="font-mono text-xs" onChange={(e) => ops.onChange((t) => updateNode(t, n.id, { content: e.target.value || null }), `content:${n.id}`)} />
                </div>
              </div>
            )}

            {n.children.length > 0 && <TreeRows nodes={n.children} depth={depth + 1} branch={b} ops={ops} />}
          </li>
        );
      })}
    </ul>
  );
}

function IconAction({ label, onClick, icon, disabled }: { label: string; onClick: () => void; icon: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent">
      {icon}
    </button>
  );
}
