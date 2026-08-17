'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { isAdmin } from '@/lib/roles';
import type { UserRole } from '@/lib/roles';

interface ExamOption {
  id: string;
  name: string;
  programName: string;
}

interface QuestionRow {
  id: string;
  stem: string;
  difficulty: string;
  status: string;
  authorName: string | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  PUBLISHED: 'success',
  DRAFT: 'neutral',
  IN_REVIEW: 'warning',
  ARCHIVED: 'neutral',
};

const BULK_STATUS_VALUES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;

export function QuestionBankBrowser({ exams, role }: { exams: ExamOption[]; role: UserRole }) {
  const canBulkEdit = isAdmin(role);
  const [examId, setExamId] = useState('all');
  // Default view is the review queue: the 10 most recent questions awaiting review, not
  // the full catalog — admins can still switch to another status via the filter above.
  const [status, setStatus] = useState('IN_REVIEW');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTarget, setBulkTarget] = useState<(typeof BULK_STATUS_VALUES)[number]>('PUBLISHED');
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (examId !== 'all') params.set('examId', examId);
    if (status !== 'all') params.set('status', status);
    if (search) params.set('search', search);
    params.set('limit', String(pageSize));
    params.set('page', String(page));
    const res = await fetch(`/api/v1/admin/questions?${params}`);
    const json = await res.json();
    setQuestions(json.data ?? []);
    setMeta(json.meta ?? null);
    setSelected(new Set());
    setLoading(false);
  }, [examId, status, search, page, pageSize]);

  useEffect(() => {
    const timeout = setTimeout(load, 200); // debounce search keystrokes
    return () => clearTimeout(timeout);
  }, [load]);

  function resetPaging() {
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === questions.length ? new Set() : new Set(questions.map((q) => q.id))));
  };

  const applyBulkStatus = async () => {
    setApplying(true);
    const res = await fetch('/api/v1/admin/questions/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected).map(Number), status: bulkTarget }),
    });
    setApplying(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error((err.error as string) ?? 'Bulk update failed');
      return;
    }
    toast.success(`${selected.size} question${selected.size === 1 ? '' : 's'} updated`);
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={examId}
          onValueChange={(v) => {
            setExamId(v);
            resetPaging();
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All Exams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams.map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            resetPaging();
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="IN_REVIEW">In Review</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPaging();
            }}
            placeholder="Search question text…"
            className="pl-9"
          />
        </div>
      </div>

      {canBulkEdit && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
          <p className="text-body-sm text-foreground">{selected.size} selected</p>
          <Select value={bulkTarget} onValueChange={(v) => setBulkTarget(v as (typeof BULK_STATUS_VALUES)[number])}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BULK_STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'PUBLISHED' ? 'Publish' : s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={applyBulkStatus} disabled={applying}>
            {applying ? 'Applying…' : 'Apply'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} disabled={applying}>
            Clear selection
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <p className="text-body-sm p-6 text-muted-foreground">Loading…</p>
        ) : questions.length === 0 ? (
          <p className="text-body-sm p-6 text-muted-foreground">No questions match your filters.</p>
        ) : (
          <div className="divide-y divide-border">
            {canBulkEdit && (
              <div className="flex items-center gap-3 bg-muted/30 p-4">
                <Checkbox
                  checked={selected.size === questions.length}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
                <span className="text-body-sm text-muted-foreground">Select all</span>
              </div>
            )}
            {questions.map((q) => (
              <div key={q.id} className="flex items-center gap-3 p-4 transition-colors hover:bg-accent">
                {canBulkEdit && (
                  <Checkbox checked={selected.has(q.id)} onCheckedChange={() => toggleOne(q.id)} aria-label="Select question" />
                )}
                <Link href={`/admin/questions/${q.id}/edit`} className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-body-sm line-clamp-1 text-foreground">{q.stem}</p>
                    {q.authorName && <p className="text-xs text-muted-foreground">by {q.authorName}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="neutral">{q.difficulty}</Badge>
                    <Badge variant={STATUS_VARIANT[q.status] ?? 'neutral'}>{q.status}</Badge>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {meta && (
        <PaginationBar
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={pageSize}
          itemLabel="question"
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
