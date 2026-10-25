'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TaxonomyStatus = 'ACTIVE' | 'ARCHIVED';

interface Program {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: TaxonomyStatus;
}
interface Exam {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: TaxonomyStatus;
  programId: string;
  programName: string;
  /** Published, public content counts — returned by the admin exams list only. */
  content?: { chapters: number; questions: number; mocks: number; articles: number };
}
interface NodeItem {
  id: string;
  name: string;
  slug: string;
  nodeType: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: TaxonomyStatus;
  parents: { id: string; name: string }[];
}

const NODE_TYPES = ['SUBJECT', 'CHAPTER', 'TOPIC', 'SUBTOPIC'] as const;
const STATUS_VALUES: TaxonomyStatus[] = ['ACTIVE', 'ARCHIVED'];
// ARCHIVED is shown as "Inactive": hidden from every public page and API, kept in admin.
const STATUS_LABEL: Record<TaxonomyStatus, string> = { ACTIVE: 'Active', ARCHIVED: 'Inactive' };
const STATUS_BADGE: Record<TaxonomyStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  ARCHIVED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load');
  return (await res.json()).data;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err.error as string) ?? 'Request failed');
  }
  return (await res.json()).data;
}

async function patchJson(url: string, body: unknown) {
  const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err.error as string) ?? 'Request failed');
  }
  return (await res.json()).data;
}

function StatusSelect({ value, onChange }: { value: TaxonomyStatus; onChange: (v: TaxonomyStatus) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TaxonomyStatus)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_VALUES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Programs ──────────────────────────────────────────────────────────────

function ProgramDialog({ program, exams, onClose }: { program: Program; exams: Exam[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(program.thumbnailUrl ?? '');
  const [status, setStatus] = useState<TaxonomyStatus>(program.status);
  const [addExamId, setAddExamId] = useState('');

  const save = useMutation({
    mutationFn: () =>
      patchJson(`/api/v1/admin/curriculum/programs/${program.id}`, { name, description, thumbnailUrl: thumbnailUrl || undefined, status }),
    onSuccess: () => {
      toast.success('Program saved');
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addExam = useMutation({
    mutationFn: (examId: string) => patchJson(`/api/v1/admin/curriculum/exams/${examId}`, { programId: program.id }),
    onSuccess: () => {
      toast.success('Exam added to program');
      setAddExamId('');
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const examsInProgram = exams.filter((e) => e.programId === program.id);
  const otherExams = exams.filter((e) => e.programId !== program.id);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit program</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What this program covers…" />
          </div>
          <div className="space-y-1.5">
            <Label>Thumbnail / banner image URL</Label>
            <Input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <StatusSelect value={status} onChange={setStatus} />
          </div>
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || name.trim().length < 2} className="gap-1.5">
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Exams in this program ({examsInProgram.length})</Label>
          {examsInProgram.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exams yet.</p>
          ) : (
            <ul className="space-y-1">
              {examsInProgram.map((e) => (
                <li key={e.id} className="text-sm text-foreground">
                  {e.name}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Select value={addExamId} onValueChange={setAddExamId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add an existing exam…" />
              </SelectTrigger>
              <SelectContent>
                {otherExams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} — currently in {e.programName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={!addExamId || addExam.isPending}
              onClick={() => addExam.mutate(addExamId)}
            >
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            An exam belongs to exactly one program — adding it here moves it out of its current program.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProgramsTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [editing, setEditing] = useState<Program | null>(null);
  const { data: programs, isLoading } = useQuery({ queryKey: ['admin-programs'], queryFn: () => fetchJson<Program[]>('/api/v1/admin/curriculum/programs') });
  const { data: examList } = useQuery({ queryKey: ['admin-exams'], queryFn: () => fetchJson<Exam[]>('/api/v1/admin/curriculum/exams') });

  const create = useMutation({
    mutationFn: () =>
      postJson('/api/v1/admin/curriculum/programs', { name, description: description || undefined, thumbnailUrl: thumbnailUrl || undefined }),
    onSuccess: () => {
      toast.success('Program created');
      setName('');
      setDescription('');
      setThumbnailUrl('');
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="max-w-md space-y-3"
      >
        <div className="space-y-1.5">
          <Label htmlFor="program-name">New program</Label>
          <Input id="program-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Engineering Entrance" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="program-description">Description</Label>
          <Textarea
            id="program-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional — what this program covers…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="program-thumbnail">Thumbnail / banner image URL</Label>
          <Input
            id="program-thumbnail"
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Optional — https://…"
          />
        </div>
        <Button type="submit" disabled={create.isPending || name.trim().length < 2} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      <div className="divide-y divide-border rounded-lg border border-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {programs?.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground">/{p.slug}</span>
              </div>
              {p.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.description}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge className={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
              <Button variant="ghost" size="icon-sm" aria-label="Edit program" onClick={() => setEditing(p)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {programs?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No programs yet.</p>}
      </div>

      {editing && <ProgramDialog program={editing} exams={examList ?? []} onClose={() => setEditing(null)} />}
    </div>
  );
}

// ── Exams ─────────────────────────────────────────────────────────────────

function ExamDialog({
  exam,
  programs,
  nodes,
  onClose,
}: {
  exam: Exam;
  programs: Program[];
  nodes: NodeItem[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(exam.name);
  const [description, setDescription] = useState(exam.description ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(exam.thumbnailUrl ?? '');
  const [status, setStatus] = useState<TaxonomyStatus>(exam.status);
  const [programId, setProgramId] = useState(exam.programId);

  const [checkedNodeIds, setCheckedNodeIds] = useState<Set<string> | null>(null);

  useQuery({
    queryKey: ['admin-exam-node-ids', exam.id],
    queryFn: async () => {
      const ids = await fetchJson<string[]>(`/api/v1/admin/curriculum/exams/${exam.id}/nodes`);
      setCheckedNodeIds(new Set(ids));
      return ids;
    },
  });

  const save = useMutation({
    mutationFn: () =>
      patchJson(`/api/v1/admin/curriculum/exams/${exam.id}`, {
        name,
        description,
        thumbnailUrl: thumbnailUrl || undefined,
        status,
        programId,
        nodeIds: checkedNodeIds ? Array.from(checkedNodeIds) : undefined,
      }),
    onSuccess: () => {
      toast.success('Exam saved');
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function toggleNode(nodeId: string, checked: boolean) {
    setCheckedNodeIds((prev) => {
      const next = new Set(prev ?? []);
      if (checked) next.add(nodeId);
      else next.delete(nodeId);
      return next;
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit exam</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What this exam is for…" />
          </div>
          <div className="space-y-1.5">
            <Label>Thumbnail / banner image URL</Label>
            <Input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <StatusSelect value={status} onChange={setStatus} />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Curriculum nodes mapped to this exam</Label>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
            {nodes.length === 0 && <p className="p-2 text-sm text-muted-foreground">No curriculum nodes yet.</p>}
            {nodes.map((n) => (
              <label key={n.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50">
                <Checkbox
                  checked={checkedNodeIds?.has(n.id) ?? false}
                  onCheckedChange={(checked) => toggleNode(n.id, checked === true)}
                />
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{n.nodeType}</span>
                <span className="text-foreground">{n.name}</span>
              </label>
            ))}
          </div>
        </div>

        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || name.trim().length < 2} className="gap-1.5">
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

type ExamFilter = 'all' | 'active' | 'inactive' | 'empty';

/** No published questions, mocks or articles — chapters alone don't count as content. */
function isEmptyExam(e: Exam) {
  return !!e.content && e.content.questions === 0 && e.content.mocks === 0 && e.content.articles === 0;
}

function ExamsTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [programId, setProgramId] = useState('');
  const [editing, setEditing] = useState<Exam | null>(null);
  const [filter, setFilter] = useState<ExamFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data: programs } = useQuery({ queryKey: ['admin-programs'], queryFn: () => fetchJson<Program[]>('/api/v1/admin/curriculum/programs') });
  const { data: examList, isLoading } = useQuery({ queryKey: ['admin-exams'], queryFn: () => fetchJson<Exam[]>('/api/v1/admin/curriculum/exams') });

  const setStatus = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TaxonomyStatus }) => patchJson('/api/v1/admin/curriculum/exams', { ids, status }),
    onSuccess: (_data, { ids, status }) => {
      toast.success(`${ids.length} exam${ids.length === 1 ? '' : 's'} marked ${STATUS_LABEL[status].toLowerCase()}`);
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const visibleExams = (examList ?? []).filter((e) => {
    if (filter === 'active') return e.status === 'ACTIVE';
    if (filter === 'inactive') return e.status === 'ARCHIVED';
    if (filter === 'empty') return isEmptyExam(e);
    return true;
  });
  const counts = {
    active: examList?.filter((e) => e.status === 'ACTIVE').length ?? 0,
    inactive: examList?.filter((e) => e.status === 'ARCHIVED').length ?? 0,
    emptyActive: examList?.filter((e) => e.status === 'ACTIVE' && isEmptyExam(e)).length ?? 0,
  };
  const allVisibleSelected = visibleExams.length > 0 && visibleExams.every((e) => selected.has(e.id));
  function toggleSelected(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  }
  const { data: nodes } = useQuery({ queryKey: ['admin-nodes'], queryFn: () => fetchJson<NodeItem[]>('/api/v1/admin/curriculum/nodes') });

  const create = useMutation({
    mutationFn: () =>
      postJson('/api/v1/admin/curriculum/exams', { name, description: description || undefined, thumbnailUrl: thumbnailUrl || undefined, programId }),
    onSuccess: () => {
      toast.success('Exam created');
      setName('');
      setDescription('');
      setThumbnailUrl('');
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="max-w-lg space-y-3"
      >
        <div className="flex items-end gap-2">
          <div className="w-40 space-y-1.5">
            <Label>Program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {programs?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="exam-name">New exam</Label>
            <Input id="exam-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="JEE Advanced" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exam-description">Description</Label>
          <Textarea
            id="exam-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional — what this exam is for…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exam-thumbnail">Thumbnail / banner image URL</Label>
          <Input
            id="exam-thumbnail"
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Optional — https://…"
          />
        </div>
        <Button type="submit" disabled={create.isPending || !programId || name.trim().length < 2} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as ExamFilter)}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All exams ({examList?.length ?? 0})</SelectItem>
                <SelectItem value="active">Active ({counts.active})</SelectItem>
                <SelectItem value="inactive">Inactive ({counts.inactive})</SelectItem>
                <SelectItem value="empty">No published content</SelectItem>
              </SelectContent>
            </Select>
            {counts.emptyActive > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilter('empty');
                  setSelected(new Set(examList!.filter((e) => e.status === 'ACTIVE' && isEmptyExam(e)).map((e) => e.id)));
                }}
              >
                Select {counts.emptyActive} active exam{counts.emptyActive === 1 ? '' : 's'} with no content
              </Button>
            )}
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" variant="outline" className="gap-1.5" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ ids: [...selected], status: 'ACTIVE' })}>
                <Eye className="h-3.5 w-3.5" /> Mark active
              </Button>
              <Button size="sm" className="gap-1.5" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ ids: [...selected], status: 'ARCHIVED' })}>
                <EyeOff className="h-3.5 w-3.5" /> Mark inactive
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Inactive exams are hidden from every public page, list and API (exam pages, practice, blogs, onboarding, sitemap, mock creation). They stay here
          so you can reactivate them.
        </p>

        <div className="divide-y divide-border rounded-lg border border-border">
          {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {visibleExams.length > 0 && (
            <label className="flex items-center gap-3 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={(checked) => {
                  const next = new Set(selected);
                  for (const e of visibleExams) {
                    if (checked) next.add(e.id);
                    else next.delete(e.id);
                  }
                  setSelected(next);
                }}
                aria-label="Select all shown exams"
              />
              Select all shown
            </label>
          )}
          {visibleExams.map((e) => {
            const empty = isEmptyExam(e);
            return (
              <div key={e.id} className={`flex items-center justify-between gap-4 p-3 ${e.status === 'ARCHIVED' ? 'bg-muted/20' : ''}`}>
                <div className="flex min-w-0 items-start gap-3">
                  <Checkbox className="mt-1" checked={selected.has(e.id)} onCheckedChange={(checked) => toggleSelected(e.id, checked === true)} aria-label={`Select ${e.name}`} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-medium ${e.status === 'ARCHIVED' ? 'text-muted-foreground' : 'text-foreground'}`}>{e.name}</span>
                      <span className="text-xs text-muted-foreground">
                        /{e.slug} · {e.programName}
                      </span>
                    </div>
                    {e.content && (
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {empty ? (
                          <span className="font-medium text-warning">No published content</span>
                        ) : (
                          <>
                            <span>{e.content.questions} questions</span>
                            <span>{e.content.mocks} mocks</span>
                            <span>{e.content.articles} articles</span>
                          </>
                        )}
                        <span>{e.content.chapters} chapters</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge className={STATUS_BADGE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                  <Switch
                    checked={e.status === 'ACTIVE'}
                    disabled={setStatus.isPending}
                    onCheckedChange={(checked) => setStatus.mutate({ ids: [e.id], status: checked ? 'ACTIVE' : 'ARCHIVED' })}
                    aria-label={`${e.name} is ${STATUS_LABEL[e.status].toLowerCase()}`}
                  />
                  <Button variant="ghost" size="icon-sm" aria-label="Edit exam" onClick={() => setEditing(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          {!isLoading && visibleExams.length === 0 && <p className="p-4 text-sm text-muted-foreground">No exams match this filter.</p>}
        </div>
      </div>

      {editing && <ExamDialog exam={editing} programs={programs ?? []} nodes={nodes ?? []} onClose={() => setEditing(null)} />}
    </div>
  );
}

// ── Curriculum nodes ──────────────────────────────────────────────────────

function NodeDialog({ node, nodes, onClose }: { node: NodeItem; nodes: NodeItem[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(node.name);
  const [description, setDescription] = useState(node.description ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(node.thumbnailUrl ?? '');
  const [status, setStatus] = useState<TaxonomyStatus>(node.status);
  const [parentIds, setParentIds] = useState<Set<string>>(new Set(node.parents.map((p) => p.id)));

  const parentOptions = nodes.filter((n) => n.id !== node.id);

  const save = useMutation({
    mutationFn: () =>
      patchJson(`/api/v1/admin/curriculum/nodes/${node.id}`, {
        name,
        description,
        thumbnailUrl: thumbnailUrl || undefined,
        status,
        parentNodeIds: Array.from(parentIds),
      }),
    onSuccess: () => {
      toast.success('Node saved');
      queryClient.invalidateQueries({ queryKey: ['admin-nodes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function toggleParent(parentId: string, checked: boolean) {
    setParentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(parentId);
      else next.delete(parentId);
      return next;
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {node.nodeType.toLowerCase()}: {node.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What this covers…" />
          </div>
          <div className="space-y-1.5">
            <Label>Thumbnail / banner image URL</Label>
            <Input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <StatusSelect value={status} onChange={setStatus} />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>
            Parent nodes {parentIds.size === 0 && <span className="font-normal text-muted-foreground">(none — this is a root node)</span>}
          </Label>
          <p className="text-xs text-muted-foreground">
            A node can have more than one parent — e.g. Thermodynamics can sit under both Physics and Chemistry.
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
            {parentOptions.length === 0 && <p className="p-2 text-sm text-muted-foreground">No other nodes yet.</p>}
            {parentOptions.map((n) => (
              <label key={n.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50">
                <Checkbox checked={parentIds.has(n.id)} onCheckedChange={(checked) => toggleParent(n.id, checked === true)} />
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{n.nodeType}</span>
                <span className="text-foreground">{n.name}</span>
              </label>
            ))}
          </div>
        </div>

        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || name.trim().length < 2} className="gap-1.5">
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function NodesTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [nodeType, setNodeType] = useState<(typeof NODE_TYPES)[number]>('SUBJECT');
  const [parentNodeId, setParentNodeId] = useState<string>('');
  const [examId, setExamId] = useState<string>('');
  const [editing, setEditing] = useState<NodeItem | null>(null);
  const { data: nodes, isLoading } = useQuery({ queryKey: ['admin-nodes'], queryFn: () => fetchJson<NodeItem[]>('/api/v1/admin/curriculum/nodes') });
  const { data: examList } = useQuery({ queryKey: ['admin-exams'], queryFn: () => fetchJson<Exam[]>('/api/v1/admin/curriculum/exams') });

  const create = useMutation({
    mutationFn: () =>
      postJson('/api/v1/admin/curriculum/nodes', {
        name,
        description: description || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        nodeType,
        parentNodeId: parentNodeId || undefined,
        examId: examId || undefined,
      }),
    onSuccess: () => {
      toast.success('Node created');
      setName('');
      setDescription('');
      setThumbnailUrl('');
      queryClient.invalidateQueries({ queryKey: ['admin-nodes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="max-w-2xl space-y-3"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 space-y-1.5 sm:col-span-1">
            <Label>Type</Label>
            <Select value={nodeType} onValueChange={(v) => setNodeType(v as typeof nodeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NODE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Algebra" />
          </div>
          <div className="col-span-2 space-y-1.5 sm:col-span-1">
            <Label>Parent node</Label>
            <Select value={parentNodeId} onValueChange={setParentNodeId}>
              <SelectTrigger>
                <SelectValue placeholder="None (root)" />
              </SelectTrigger>
              <SelectContent>
                {nodes?.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5 sm:col-span-1">
            <Label>Attach to exam</Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {examList?.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional — what this covers…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="node-thumbnail">Thumbnail / banner image URL</Label>
          <Input
            id="node-thumbnail"
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Optional — https://…"
          />
        </div>
        <Button type="submit" disabled={create.isPending || name.trim().length < 2} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add node
        </Button>
      </form>

      <div className="divide-y divide-border rounded-lg border border-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {nodes?.map((n) => (
          <div key={n.id} className="flex items-center justify-between gap-4 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{n.nodeType}</span>
              <span className="font-medium text-foreground">{n.name}</span>
              {n.parents.length > 0 && (
                <span className="text-xs text-muted-foreground">under {n.parents.map((p) => p.name).join(', ')}</span>
              )}
              {n.description && <span className="truncate text-xs text-muted-foreground">— {n.description}</span>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge className={STATUS_BADGE[n.status]}>{STATUS_LABEL[n.status]}</Badge>
              <Button variant="ghost" size="icon-sm" aria-label="Edit node" onClick={() => setEditing(n)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {nodes?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No nodes yet.</p>}
      </div>

      {editing && <NodeDialog node={editing} nodes={nodes ?? []} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function CurriculumClient() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Curriculum</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Programs group exams; exams map to curriculum nodes (subjects/chapters/topics/subtopics), shared across exams.
      </p>

      <Tabs defaultValue="programs" className="mt-6">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
        </TabsList>
        <TabsContent value="programs" className="mt-4">
          <ProgramsTab />
        </TabsContent>
        <TabsContent value="exams" className="mt-4">
          <ExamsTab />
        </TabsContent>
        <TabsContent value="nodes" className="mt-4">
          <NodesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
