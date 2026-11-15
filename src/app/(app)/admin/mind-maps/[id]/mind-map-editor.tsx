'use client';

import { useMemo, useState } from 'react';
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
  type MindMapTreeNode,
} from '@/lib/mind-maps';
import { addChild, addMissingCurriculum, indentNode, moveNode, newNode, outdentNode, removeNode, updateNode } from '@/lib/mind-map-tree-ops';
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
}

interface Fields {
  seoTitle: string;
  seoDescription: string;
  intro: string;
  revisionNotes: string;
  faqs: MindMapFaq[];
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
  return { seoTitle: map.seoTitle ?? '', seoDescription: map.seoDescription ?? '', intro: map.intro ?? '', revisionNotes: map.revisionNotes ?? '', faqs: map.faqs ?? [] };
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

  const edit = (next: MindMapTreeNode[]) => {
    setTree(next);
    setDirty(true);
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
              </div>

              <div className="mt-3 rounded-xl border border-border bg-card">
                {tree.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No nodes yet. Add a topic, or pull topics from the curriculum.</p>
                ) : (
                  <TreeRows
                    nodes={tree}
                    depth={0}
                    branch={null}
                    disabled={archived}
                    openRow={openRow}
                    setOpenRow={setOpenRow}
                    options={options}
                    optionName={optionName}
                    onChange={(fn) => edit(fn(tree))}
                  />
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Main topics come from the chapter&apos;s curriculum. Indent to nest, arrows to reorder. Custom nodes (no linked topic) are flagged for review.</p>
            </div>

            <div className="xl:sticky xl:top-20 xl:self-start">
              <p className="mb-2 text-sm font-medium text-foreground">Live preview</p>
              {tree.length > 0 ? <MindMap title={title} nodes={tree} className="h-[560px] min-h-0" /> : <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">Nothing to preview yet</div>}
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
      </Tabs>
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

function TreeRows({
  nodes,
  depth,
  branch,
  disabled,
  openRow,
  setOpenRow,
  options,
  optionName,
  onChange,
}: {
  nodes: MindMapTreeNode[];
  depth: number;
  branch: number | null;
  disabled: boolean;
  openRow: string | null;
  setOpenRow: (id: string | null) => void;
  options: { id: string; name: string; depth: number }[];
  optionName: Map<string, string>;
  onChange: (fn: (tree: MindMapTreeNode[]) => MindMapTreeNode[]) => void;
}) {
  return (
    <ul className={cn(depth === 0 ? 'divide-y divide-border' : '')}>
      {nodes.map((n, i) => {
        const b = branch ?? i;
        const open = openRow === n.id;
        return (
          <li key={n.id}>
            <div className="flex items-center gap-1.5 py-1.5 pr-2" style={{ paddingLeft: 8 + depth * 20 }}>
              <button type="button" onClick={() => setOpenRow(open ? null : n.id)} aria-label={open ? 'Hide details' : 'Edit details'} aria-expanded={open} className="rounded p-1 text-muted-foreground hover:bg-muted">
                <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
              </button>
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', colourFor(b).dot)} aria-hidden />
              <Input
                value={n.label}
                disabled={disabled}
                maxLength={160}
                onChange={(e) => onChange((t) => updateNode(t, n.id, { label: e.target.value }))}
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
                <IconAction label="Move up" disabled={disabled || i === 0} onClick={() => onChange((t) => moveNode(t, n.id, -1))} icon={<ArrowUp className="h-3.5 w-3.5" />} />
                <IconAction label="Move down" disabled={disabled || i === nodes.length - 1} onClick={() => onChange((t) => moveNode(t, n.id, 1))} icon={<ArrowDown className="h-3.5 w-3.5" />} />
                <IconAction label="Outdent" disabled={disabled || depth === 0} onClick={() => onChange((t) => outdentNode(t, n.id))} icon={<IndentDecrease className="h-3.5 w-3.5" />} />
                <IconAction label="Indent" disabled={disabled || i === 0} onClick={() => onChange((t) => indentNode(t, n.id))} icon={<IndentIncrease className="h-3.5 w-3.5" />} />
                <IconAction label="Add child" disabled={disabled} onClick={() => onChange((t) => addChild(t, n.id, newNode('New subtopic')))} icon={<Plus className="h-3.5 w-3.5" />} />
                <IconAction
                  label="Delete"
                  disabled={disabled}
                  onClick={() => {
                    if (n.children.length === 0 || confirm(`Delete "${n.label}" and its ${countNodes(n.children)} child nodes?`)) onChange((t) => removeNode(t, n.id));
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
                    disabled={disabled}
                    onChange={(e) => onChange((t) => updateNode(t, n.id, { curriculumNodeId: e.target.value || null }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">— Custom node (not in curriculum) —</option>
                    {options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {'  '.repeat(o.depth)}
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Short description (hover card, topic list)</Label>
                  <Textarea value={n.description ?? ''} disabled={disabled} maxLength={500} rows={2} onChange={(e) => onChange((t) => updateNode(t, n.id, { description: e.target.value || null }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Learning content — definitions, formulas (Markdown, optional)</Label>
                  <Textarea value={n.content ?? ''} disabled={disabled} rows={4} className="font-mono text-xs" onChange={(e) => onChange((t) => updateNode(t, n.id, { content: e.target.value || null }))} />
                </div>
              </div>
            )}

            {n.children.length > 0 && (
              <TreeRows nodes={n.children} depth={depth + 1} branch={b} disabled={disabled} openRow={openRow} setOpenRow={setOpenRow} options={options} optionName={optionName} onChange={onChange} />
            )}
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
