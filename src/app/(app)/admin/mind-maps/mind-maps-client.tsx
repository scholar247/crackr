'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExternalLink, Network, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { MIND_MAP_STATUSES, MIND_MAP_STATUS_LABELS, mindMapsPath, type MindMapStatus } from '@/lib/mind-maps';

interface SyllabusNode {
  id: string;
  nodeType: string;
  name: string;
  slug: string;
  children: SyllabusNode[];
}

interface ExamOption {
  id: string;
  name: string;
  slug: string;
  syllabus: SyllabusNode[];
}

interface Row {
  id: string;
  examId: string;
  examName: string;
  examSlug: string;
  chapterNodeId: string;
  chapterName: string;
  status: MindMapStatus;
  publishedAt: string | null;
  updatedAt: string;
  updatedByName: string | null;
  nodeCount: number;
  hasPendingChanges: boolean;
}

interface ListResponse {
  data: Row[];
  meta: { exams: ExamOption[]; existing: { examId: string; chapterNodeId: string }[] };
}

const ALL = 'all';

export const STATUS_BADGE: Record<MindMapStatus, 'outline' | 'info' | 'success' | 'neutral'> = {
  DRAFT: 'outline',
  IN_REVIEW: 'info',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
};

async function api<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as T;
}

function countDescendants(n: SyllabusNode): number {
  return n.children.reduce((s, c) => s + 1 + countDescendants(c), 0);
}

export function MindMapsClient() {
  const qc = useQueryClient();
  const router = useRouter();
  const [examFilter, setExamFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['admin-mind-maps'], queryFn: () => api<ListResponse>('/api/v1/admin/mind-maps') });
  const rows = useMemo(() => data?.data ?? [], [data]);
  const exams = useMemo(() => data?.meta.exams ?? [], [data]);
  const existing = useMemo(() => new Set((data?.meta.existing ?? []).map((e) => `${e.examId}:${e.chapterNodeId}`)), [data]);
  const filtered = rows.filter((r) => (examFilter === ALL || r.examId === examFilter) && (statusFilter === ALL || r.status === statusFilter));

  const remove = useMutation({
    mutationFn: (r: Row) => api(`/api/v1/admin/mind-maps/${r.id}`, 'DELETE'),
    onSuccess: () => {
      toast.success('Mind map deleted');
      qc.invalidateQueries({ queryKey: ['admin-mind-maps'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Coverage: published maps vs chapters in each exam's syllabus.
  const coverage = exams.map((e) => {
    const chapters = e.syllabus.flatMap((s) => s.children.filter((c) => c.nodeType === 'CHAPTER'));
    const published = rows.filter((r) => r.examId === e.id && r.status === 'PUBLISHED').length;
    const started = rows.filter((r) => r.examId === e.id).length;
    return { exam: e, chapters: chapters.length, published, started };
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mind maps</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Chapter mind maps generated from the curriculum (topics → subtopics). Edit the draft, send it for review, then publish — the public page only changes when you publish.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/mind-maps/samples">Style samples</Link>
          </Button>
          <Button onClick={() => setCreating(true)} disabled={exams.length === 0}>
            <Plus className="mr-1.5 h-4 w-4" /> New mind map
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {coverage.map((c) => (
          <div key={c.exam.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">{c.exam.name}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {c.published}
              <span className="text-sm font-normal text-muted-foreground"> / {c.chapters} chapters published</span>
            </p>
            <p className="text-xs text-muted-foreground">{c.started} started</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <Select value={examFilter} onValueChange={setExamFilter}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by exam">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All exams</SelectItem>
            {exams.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            {MIND_MAP_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {MIND_MAP_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">{filtered.length} mind maps</span>
      </div>

      <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground">{rows.length ? 'No mind maps match these filters.' : 'No mind maps yet — create one from a chapter.'}</p>}
        {filtered.map((r) => {
          const exam = exams.find((e) => e.id === r.examId);
          const subject = exam?.syllabus.find((s) => s.children.some((c) => c.id === r.chapterNodeId));
          const livePath = subject ? mindMapsPath(r.examSlug, subject.slug, exam!.syllabus.flatMap((s) => s.children).find((c) => c.id === r.chapterNodeId)?.slug) : null;
          return (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
              <Network className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.chapterName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.examName}
                  {subject ? ` · ${subject.name}` : ''} · {r.nodeCount} nodes · updated {formatDate(r.updatedAt)}
                  {r.updatedByName ? ` by ${r.updatedByName}` : ''}
                </p>
              </div>
              {r.hasPendingChanges && <Badge variant="warning">Unpublished changes</Badge>}
              <Badge variant={STATUS_BADGE[r.status]}>{MIND_MAP_STATUS_LABELS[r.status]}</Badge>
              <Button variant="ghost" size="icon" asChild aria-label="Edit">
                <Link href={`/admin/mind-maps/${r.id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              {r.status === 'PUBLISHED' && livePath && (
                <Button variant="ghost" size="icon" asChild aria-label="View on site">
                  <a href={livePath} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                onClick={() => {
                  if (confirm(`Delete the "${r.chapterName}" mind map? This cannot be undone.`)) remove.mutate(r);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>

      <CreateDialog
        open={creating}
        onOpenChange={setCreating}
        exams={exams}
        existing={existing}
        onCreated={(id) => {
          qc.invalidateQueries({ queryKey: ['admin-mind-maps'] });
          router.push(`/admin/mind-maps/${id}`);
        }}
      />
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  exams,
  existing,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exams: ExamOption[];
  existing: Set<string>;
  onCreated: (id: string) => void;
}) {
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const exam = exams.find((e) => e.id === examId);
  const subject = exam?.syllabus.find((s) => s.id === subjectId);
  const chapters = subject?.children.filter((c) => c.nodeType === 'CHAPTER') ?? [];
  const chapter = chapters.find((c) => c.id === chapterId);

  const create = useMutation({
    mutationFn: () => api<{ data: { id: string } }>('/api/v1/admin/mind-maps', 'POST', { examId, chapterNodeId: chapterId }),
    onSuccess: (res) => {
      toast.success('Mind map generated from the curriculum');
      onOpenChange(false);
      setChapterId('');
      onCreated(res.data.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New mind map</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Exam</Label>
            <Select
              value={examId}
              onValueChange={(v) => {
                setExamId(v);
                setSubjectId('');
                setChapterId('');
              }}
            >
              <SelectTrigger aria-label="Exam">
                <SelectValue placeholder="Choose exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Select
              value={subjectId}
              onValueChange={(v) => {
                setSubjectId(v);
                setChapterId('');
              }}
              disabled={!exam}
            >
              <SelectTrigger aria-label="Subject">
                <SelectValue placeholder={exam ? 'Choose subject' : 'Choose an exam first'} />
              </SelectTrigger>
              <SelectContent>
                {exam?.syllabus.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Chapter</Label>
            <Select value={chapterId} onValueChange={setChapterId} disabled={!subject}>
              <SelectTrigger aria-label="Chapter">
                <SelectValue placeholder={subject ? 'Choose chapter' : 'Choose a subject first'} />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c) => {
                  const taken = existing.has(`${examId}:${c.id}`);
                  return (
                    <SelectItem key={c.id} value={c.id} disabled={taken}>
                      {c.name} {taken ? '— already has a map' : `· ${countDescendants(c)} topics/subtopics`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {chapter && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              {chapter.children.length > 0 ? (
                <>
                  <p className="font-medium text-foreground">Will be generated from the curriculum:</p>
                  <ul className="mt-1.5 list-disc pl-5 text-muted-foreground">
                    {chapter.children.slice(0, 6).map((t) => (
                      <li key={t.id}>
                        {t.name}
                        {t.children.length > 0 && ` (${t.children.length} subtopics)`}
                      </li>
                    ))}
                    {chapter.children.length > 6 && <li>and {chapter.children.length - 6} more</li>}
                  </ul>
                </>
              ) : (
                <p className="text-muted-foreground">This chapter has no topics mapped in the curriculum yet. You can still create the map and add topics by hand, but it can&apos;t be published until it has at least one.</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={!chapterId || create.isPending}>
              {create.isPending ? 'Generating…' : 'Generate mind map'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
