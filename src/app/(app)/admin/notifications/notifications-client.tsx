'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExternalLink, Pencil, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, slugify } from '@/lib/utils';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
  formatNotificationDate,
  noticeHref,
  type NotificationCategory,
  type NotificationStatus,
} from '@/lib/notifications';

interface ExamOption {
  id: string;
  name: string;
  slug: string;
}

interface Notification {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: NotificationCategory;
  status: NotificationStatus;
  isImportant: boolean;
  sourceUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName: string | null;
  exams: ExamOption[];
}

interface ListResponse {
  data: Notification[];
  meta: { total: number; page: number; pageSize: number; exams: ExamOption[] };
}

interface FormState {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: NotificationCategory;
  published: boolean;
  isImportant: boolean;
  sourceUrl: string;
  /** datetime-local value in the admin's own time zone ("2026-11-15T10:30"), or "". */
  publishedAt: string;
  examIds: string[];
}

const ALL = 'all';

async function api<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as T;
}

/** ISO → value for <input type="datetime-local"> in the browser's zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toForm(n: Notification): FormState {
  return {
    title: n.title,
    slug: n.slug,
    summary: n.summary,
    content: n.content,
    category: n.category,
    published: n.status === 'PUBLISHED',
    isImportant: n.isImportant,
    sourceUrl: n.sourceUrl ?? '',
    publishedAt: toLocalInput(n.publishedAt),
    examIds: n.exams.map((e) => e.id),
  };
}

function toPayload(f: FormState) {
  return {
    title: f.title.trim(),
    slug: f.slug.trim(),
    summary: f.summary.trim(),
    content: f.content.trim(),
    category: f.category,
    status: f.published ? 'PUBLISHED' : 'DRAFT',
    isImportant: f.isImportant,
    sourceUrl: f.sourceUrl.trim() || null,
    publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : null,
    examIds: f.examIds,
  };
}

/** Live on the site: published and its publication time has arrived. */
function isLive(n: Notification, now: number) {
  return n.status === 'PUBLISHED' && !!n.publishedAt && new Date(n.publishedAt).getTime() <= now;
}

function StatusBadge({ n, now }: { n: Notification; now: number }) {
  if (n.status === 'DRAFT') return <Badge variant="outline">Draft</Badge>;
  return isLive(n, now) ? <Badge variant="success">Published</Badge> : <Badge variant="info">Scheduled</Badge>;
}

export function NotificationsClient() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters and page live in the URL so a filtered view survives reloads and can be shared.
  const filters = {
    q: searchParams.get('q') ?? '',
    status: searchParams.get('status') ?? ALL,
    category: searchParams.get('category') ?? ALL,
    examId: searchParams.get('exam') ?? ALL,
    important: searchParams.get('important') ?? ALL,
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    pageSize: Number(searchParams.get('pageSize')) || 20,
  };

  const setParams = (patch: Record<string, string | number | null>, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || v === ALL) next.delete(k);
      else next.set(k, String(v));
    }
    if (resetPage && !('page' in patch)) next.delete('page');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Search box: local state, pushed to the URL after a short pause.
  const [search, setSearch] = useState(filters.q);
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setParams({ q: search.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed value should re-arm the timer
  }, [search]);

  const apiQuery = new URLSearchParams();
  if (filters.q) apiQuery.set('q', filters.q);
  if (filters.status !== ALL) apiQuery.set('status', filters.status);
  if (filters.category !== ALL) apiQuery.set('category', filters.category);
  if (filters.examId !== ALL) apiQuery.set('examId', filters.examId);
  if (filters.important !== ALL) apiQuery.set('important', filters.important);
  apiQuery.set('page', String(filters.page));
  apiQuery.set('pageSize', String(filters.pageSize));

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-notifications', apiQuery.toString()],
    queryFn: () => api<ListResponse>(`/api/v1/admin/notifications?${apiQuery}`, 'GET'),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  const exams = data?.meta.exams ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  // Snapshot of "now" per data load, for the Scheduled badge (not re-read on every render).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => setNow(Date.now()), [data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-notifications'] });

  const [editing, setEditing] = useState<Notification | 'new' | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const payload = toPayload(form!);
      return editing === 'new' || editing === null
        ? api('/api/v1/admin/notifications', 'POST', payload)
        : api(`/api/v1/admin/notifications/${editing.id}`, 'PUT', payload);
    },
    onSuccess: () => {
      toast.success('Notification saved');
      invalidate();
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status?: NotificationStatus; isImportant?: boolean } }) =>
      api(`/api/v1/admin/notifications/${id}`, 'PATCH', body),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (n: Notification) => api(`/api/v1/admin/notifications/${n.id}`, 'DELETE'),
    onSuccess: () => {
      toast.success('Notification deleted');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setForm({
      title: '',
      slug: '',
      summary: '',
      content: '',
      category: 'GENERAL',
      published: false,
      isImportant: false,
      sourceUrl: '',
      publishedAt: '',
      // Pre-select the filtered exam: notifications are usually added one exam at a time.
      examIds: filters.examId !== ALL ? [filters.examId] : [],
    });
    setEditing('new');
  };

  const openEdit = (n: Notification) => {
    setForm(toForm(n));
    setEditing(n);
  };

  const hasFilters = !!filters.q || filters.status !== ALL || filters.category !== ALL || filters.examId !== ALL || filters.important !== ALL;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Exam notifications (date sheets, circulars, results…) shown in the notification board at the top of each exam&apos;s home page, where students read
            them in full. Only published notifications whose publication time has passed are visible; a future date schedules one.
          </p>
        </div>
        <Button onClick={openNew} disabled={exams.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" /> New notification
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, summary, slug" className="pl-8" aria-label="Search notifications" />
        </div>
        <FilterSelect
          label="Filter by exam"
          value={filters.examId}
          onChange={(v) => setParams({ exam: v })}
          options={[{ value: ALL, label: 'All exams' }, ...exams.map((e) => ({ value: e.id, label: e.name }))]}
          className="w-full sm:w-52"
        />
        <FilterSelect
          label="Filter by category"
          value={filters.category}
          onChange={(v) => setParams({ category: v })}
          options={[{ value: ALL, label: 'All categories' }, ...NOTIFICATION_CATEGORIES.map((c) => ({ value: c, label: NOTIFICATION_CATEGORY_LABELS[c] }))]}
          className="w-full sm:w-44"
        />
        <FilterSelect
          label="Filter by status"
          value={filters.status}
          onChange={(v) => setParams({ status: v })}
          options={[
            { value: ALL, label: 'Any status' },
            { value: 'PUBLISHED', label: 'Published' },
            { value: 'DRAFT', label: 'Draft' },
          ]}
          className="w-full sm:w-36"
        />
        <FilterSelect
          label="Filter by importance"
          value={filters.important}
          onChange={(v) => setParams({ important: v })}
          options={[
            { value: ALL, label: 'Any priority' },
            { value: 'true', label: 'Important' },
            { value: 'false', label: 'Normal' },
          ]}
          className="w-full sm:w-36"
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              router.replace(pathname, { scroll: false });
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <div className={cn('mt-4 divide-y divide-border rounded-xl border border-border bg-card transition-opacity', isFetching && !isLoading && 'opacity-60')}>
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">{hasFilters ? 'No notifications match these filters.' : 'No notifications yet.'}</p>
        )}
        {rows.map((n) => {
          const live = isLive(n, now);
          return (
            <div key={n.id} className="flex flex-wrap items-center gap-3 p-4">
              <button
                type="button"
                onClick={() => patch.mutate({ id: n.id, body: { isImportant: !n.isImportant } })}
                aria-label={n.isImportant ? 'Unmark important' : 'Mark important'}
                aria-pressed={n.isImportant}
                title={n.isImportant ? 'Important — click to unmark' : 'Mark as important'}
                className="rounded p-1 hover:bg-muted"
              >
                <Star className={cn('h-4 w-4', n.isImportant ? 'fill-warning text-warning' : 'text-muted-foreground')} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {NOTIFICATION_CATEGORY_LABELS[n.category]} · {n.exams.map((e) => e.name).join(', ') || 'No exam'} ·{' '}
                  {n.publishedAt ? formatNotificationDate(n.publishedAt) : 'No date'}
                  {n.createdByName ? ` · by ${n.createdByName}` : ''}
                </p>
              </div>
              <StatusBadge n={n} now={now} />
              <Switch
                checked={n.status === 'PUBLISHED'}
                onCheckedChange={(checked) => patch.mutate({ id: n.id, body: { status: checked ? 'PUBLISHED' : 'DRAFT' } })}
                aria-label={n.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
              />
              <Button variant="ghost" size="icon" asChild={live} disabled={!live} aria-label="View on site">
                {live && n.exams[0] ? (
                  <a href={noticeHref(n.exams[0].slug, n.slug)} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(n)} aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                onClick={() => {
                  if (confirm(`Delete "${n.title}"? This cannot be undone.`)) remove.mutate(n);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>

      <PaginationBar
        className="mt-4"
        page={filters.page}
        totalPages={totalPages}
        total={total}
        pageSize={filters.pageSize}
        itemLabel="notification"
        onPageChange={(p) => setParams({ page: p }, false)}
        onPageSizeChange={(s) => setParams({ pageSize: s })}
      />

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'New notification' : 'Edit notification'}</DialogTitle>
          </DialogHeader>
          {form && (
            <NotificationForm
              form={form}
              setForm={setForm}
              exams={exams}
              isNew={editing === 'new'}
              now={now}
              saving={save.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={() => save.mutate()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn(value !== ALL && 'border-primary/50 bg-primary/5', className)} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NotificationForm({
  form,
  setForm,
  exams,
  isNew,
  now,
  saving,
  onCancel,
  onSubmit,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  exams: ExamOption[];
  isNew: boolean;
  /** "Now" snapshot from the list, to tell a future (scheduled) date apart. */
  now: number;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value });
  const toggleExam = (id: string, on: boolean) => set('examIds', on ? [...form.examIds, id] : form.examIds.filter((x) => x !== id));
  const firstExam = exams.find((e) => form.examIds.includes(e.id)) ?? null;
  const previewSlug = form.slug || slugify(form.title);
  const scheduled = form.published && form.publishedAt && new Date(form.publishedAt).getTime() > now;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (form.examIds.length === 0) {
          toast.error('Choose at least one exam');
          return;
        }
        onSubmit();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="nt-title">Title</Label>
        <Input id="nt-title" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={200} required minLength={5} placeholder="CBSE Class 10 date sheet 2027 released" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nt-slug">Link slug {isNew && <span className="font-normal text-muted-foreground">(optional — generated from the title)</span>}</Label>
        <Input
          id="nt-slug"
          value={form.slug}
          onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          maxLength={220}
          placeholder={slugify(form.title) || 'auto'}
        />
        {firstExam && previewSlug && <p className="truncate text-xs text-muted-foreground">Link: {noticeHref(firstExam.slug, previewSlug)}</p>}
        {!isNew && <p className="text-xs text-muted-foreground">Changing the slug changes the notice&apos;s shareable link — old links will open the board without highlighting it.</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nt-summary">Summary</Label>
        <Textarea
          id="nt-summary"
          value={form.summary}
          onChange={(e) => set('summary', e.target.value)}
          maxLength={500}
          rows={2}
          required
          minLength={10}
          placeholder="One or two sentences shown in lists and search results."
        />
        <p className="text-right text-xs text-muted-foreground tabular-nums">{form.summary.length}/500</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nt-content">Full notification</Label>
        <Textarea
          id="nt-content"
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          rows={10}
          required
          className="font-mono text-sm"
          placeholder={'Markdown supported: ## headings, **bold**, lists, | tables |, [links](https://cbse.gov.in)'}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => set('category', v as NotificationCategory)}>
            <SelectTrigger aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTIFICATION_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {NOTIFICATION_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nt-date">Publication date</Label>
          <Input id="nt-date" type="datetime-local" value={form.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} />
          <p className="text-xs text-muted-foreground">{scheduled ? 'Scheduled: goes live at this time.' : 'Leave empty to use the time you publish.'}</p>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Show on</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {exams.map((e) => (
            <label key={e.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50">
              <Checkbox checked={form.examIds.includes(e.id)} onCheckedChange={(v) => toggleExam(e.id, v === true)} />
              {e.name}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Pick both CBSE classes for a notice that applies to Class 10 and Class 12.</p>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="nt-source">Official source link (optional)</Label>
        <Input id="nt-source" type="url" value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://www.cbse.gov.in/…" maxLength={2048} />
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch id="nt-published" checked={form.published} onCheckedChange={(v) => set('published', v)} />
          <Label htmlFor="nt-published">Published</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="nt-important" checked={form.isImportant} onCheckedChange={(v) => set('isImportant', v)} />
          <Label htmlFor="nt-important">Mark as important</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
