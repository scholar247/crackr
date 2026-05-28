'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Search, CheckSquare, Square, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { DifficultyBadge } from '@/components/mcq/difficulty-badge';
import { ContentBlockRenderer } from '@/components/mcq/content-block-renderer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { MCQClient, SubjectClient, TopicClient } from '@/types';
import type { Difficulty } from '@/types';
import { cn } from '@/lib/utils';

async function fetchMCQs(params: URLSearchParams) {
  const res = await fetch(`/api/admin/mcq?${params}`);
  return res.json();
}

async function fetchSubjects() {
  const res = await fetch('/api/subjects');
  return (await res.json()).data as SubjectClient[];
}

async function fetchTopics(subjectId?: string) {
  if (!subjectId) return [] as TopicClient[];
  const res = await fetch(`/api/subjects/${subjectId}/topics`);
  return (await res.json()).data as TopicClient[];
}

async function bulkAction(body: { action: 'delete' | 'setStatus'; ids: string[]; isActive?: boolean }) {
  const res = await fetch('/api/admin/mcq/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Bulk action failed');
  return res.json();
}

export function MCQListClient() {
  const qc = useQueryClient();

  // Filters
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const params = new URLSearchParams({
    page: String(page),
    pageSize: '20',
    ...(search ? { search } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(topicId ? { topicId } : {}),
    ...(difficulty ? { difficulty } : {}),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-mcqs', params.toString()],
    queryFn: () => fetchMCQs(params),
  });

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects });
  const { data: topics } = useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => fetchTopics(subjectId || undefined),
    enabled: !!subjectId,
  });

  const mcqs: MCQClient[] = data?.data ?? [];
  const meta = data?.meta ?? {};
  const pageIds = useMemo(() => mcqs.map((m) => m.id), [mcqs]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  // ── Single delete ────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/mcq/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error('Delete failed');
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-mcqs'] }); toast.success('MCQ deleted'); },
    onError: () => toast.error('Failed to delete MCQ'),
  });

  // ── Bulk mutations ───────────────────────────────────────────────────────────
  const bulkDeleteMutation = useMutation({
    mutationFn: () => bulkAction({ action: 'delete', ids: [...selectedIds] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-mcqs'] });
      toast.success(`${selectedIds.size} MCQ${selectedIds.size > 1 ? 's' : ''} deleted`);
      setSelectedIds(new Set());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkActivateMutation = useMutation({
    mutationFn: (isActive: boolean) => bulkAction({ action: 'setStatus', ids: [...selectedIds], isActive }),
    onSuccess: (_data, isActive) => {
      qc.invalidateQueries({ queryKey: ['admin-mcqs'] });
      toast.success(`${selectedIds.size} MCQ${selectedIds.size > 1 ? 's' : ''} marked ${isActive ? 'active' : 'inactive'}`);
      setSelectedIds(new Set());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isBulkPending = bulkDeleteMutation.isPending || bulkActivateMutation.isPending;

  // ── Selection helpers ────────────────────────────────────────────────────────
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const togglePage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...pageIds]));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); setSelectedIds(new Set()); }}
          />
        </div>

        <Select value={subjectId} onValueChange={(v) => { setSubjectId(v === 'all' ? '' : v); setTopicId(''); setPage(1); setSelectedIds(new Set()); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={topicId} onValueChange={(v) => { setTopicId(v === 'all' ? '' : v); setPage(1); setSelectedIds(new Set()); }} disabled={!subjectId}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {topics?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={difficulty} onValueChange={(v) => { setDifficulty(v === 'all' ? '' : v); setPage(1); setSelectedIds(new Set()); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {(['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as Difficulty[]).map((d) => (
              <SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkActivateMutation.mutate(true)}
              disabled={isBulkPending}
              className="gap-1.5"
            >
              <ToggleRight className="h-3.5 w-3.5" />
              Set Active
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkActivateMutation.mutate(false)}
              disabled={isBulkPending}
              className="gap-1.5"
            >
              <ToggleLeft className="h-3.5 w-3.5" />
              Set Inactive
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={isBulkPending} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedIds.size} MCQ{selectedIds.size > 1 ? 's' : ''}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The selected MCQs will be deactivated and removed from practice and new tests.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => bulkDeleteMutation.mutate()}
                  >
                    Delete all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button
                    type="button"
                    onClick={togglePage}
                    className="flex items-center justify-center"
                    aria-label="Select all on page"
                  >
                    {allPageSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : somePageSelected ? (
                      <Square className="h-4 w-4 text-primary/60" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 w-[42%]">Question</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Difficulty</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mcqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-12">
                    No MCQs found
                  </td>
                </tr>
              ) : (
                mcqs.map((mcq, i) => {
                  const selected = selectedIds.has(mcq.id);
                  return (
                    <tr
                      key={mcq.id}
                      className={cn(
                        'transition-colors',
                        selected
                          ? 'bg-primary/5'
                          : i % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      )}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleOne(mcq.id)}
                          aria-label={`Select MCQ ${mcq.id}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm line-clamp-2">
                          <ContentBlockRenderer blocks={mcq.question} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <DifficultyBadge difficulty={mcq.difficulty} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {mcq.questionType === 'SINGLE' ? 'Single' : 'Multiple'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={mcq.isActive ? 'success' : 'secondary'} className="text-xs">
                          {mcq.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/admin/mcq/${mcq.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete MCQ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will deactivate the MCQ. It will no longer appear in practice or new tests.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteMutation.mutate(mcq.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {meta.page} of {meta.totalPages} ({meta.total} total)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); setSelectedIds(new Set()); }}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => { setPage(p => p + 1); setSelectedIds(new Set()); }}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
