'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, ExternalLink, FileCheck2, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { ALL, SamplePaperFilters, type FilterOption, type Filters } from './sample-paper-filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { periodLabel, samplePaperExamConfig, samplePapersPath } from '@/lib/sample-papers';

/** The year as that exam's pages show it: "2025-26" for boards, "2026" otherwise. */
const yearLabel = (exam: { slug: string; name: string }, year: number) => periodLabel(samplePaperExamConfig(exam), year);
import { formatDate, slugify } from '@/lib/utils';

interface Paper {
  id: string;
  examId: string;
  year: number;
  subject: string;
  subjectSlug: string;
  samplePaperLink: string;
  markingSchemeLink: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Row {
  paper: Paper;
  examName: string;
  examSlug: string;
  createdByName: string | null;
  downloads: number;
}

interface ExamOption {
  id: string;
  name: string;
  slug: string;
}

interface FormState {
  examId: string;
  year: string;
  subject: string;
  samplePaperLink: string;
  markingSchemeLink: string;
  isPublished: boolean;
}


// Board exam year that the current academic session leads to (Apr–Dec → next year).
function defaultYear() {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
}

function toForm(p: Paper): FormState {
  return {
    examId: p.examId,
    year: String(p.year),
    subject: p.subject,
    samplePaperLink: p.samplePaperLink,
    markingSchemeLink: p.markingSchemeLink ?? '',
    isPublished: p.isPublished,
  };
}

function toPayload(f: FormState) {
  return {
    examId: f.examId,
    year: Number(f.year),
    subject: f.subject.trim(),
    samplePaperLink: f.samplePaperLink.trim(),
    markingSchemeLink: f.markingSchemeLink.trim() || null,
    isPublished: f.isPublished,
  };
}

async function api<T>(url: string, method: string, body?: unknown): Promise<{ data: T; meta?: { exams?: ExamOption[] } }> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}

async function uploadPdf(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/v1/media', { method: 'POST', body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Upload failed');
  return json.data.url as string;
}

export function SamplePapersClient() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Paper | 'new' | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sample-papers'],
    queryFn: () => api<Row[]>('/api/v1/admin/sample-papers', 'GET'),
  });
  const rows = useMemo(() => data?.data ?? [], [data]);
  const exams = data?.meta?.exams ?? [];

  // Filters live in the URL (?exam=&year=&subject=) so a filtered view survives a reload,
  // the back button works, and the link can be shared with another admin.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters: Filters = {
    exam: searchParams.get('exam') ?? ALL,
    year: searchParams.get('year') ?? ALL,
    subject: searchParams.get('subject') ?? ALL,
  };

  const { filtered, examOptions, yearOptions, subjectOptions } = useMemo(
    () => buildFacets(rows, exams, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is derived from searchParams
    [rows, exams, searchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<Filters>) => {
      const next = { ...filters, ...patch };
      // Drop a choice the new combination leaves empty (e.g. a subject the newly picked
      // exam doesn't have) instead of showing an empty list. Most specific first, so a
      // clash on subject clears the subject rather than the year.
      for (const key of ['subject', 'year', 'exam'] as const) {
        if (key in patch || next[key] === ALL) continue;
        if (!rows.some((r) => matches(r, { ...next }))) next[key] = ALL;
      }
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(next)) if (v !== ALL) qs.set(k, v);
      router.replace(qs.size ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is derived from searchParams
    [rows, searchParams, pathname, router],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-sample-papers'] });

  const save = useMutation({
    mutationFn: () => {
      const payload = toPayload(form!);
      return editing === 'new' || editing === null
        ? api('/api/v1/admin/sample-papers', 'POST', payload)
        : api(`/api/v1/admin/sample-papers/${editing.id}`, 'PATCH', payload);
    },
    onSuccess: () => {
      toast.success('Sample paper saved');
      invalidate();
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (p: Paper) => api(`/api/v1/admin/sample-papers/${p.id}`, 'PATCH', toPayload({ ...toForm(p), isPublished: !p.isPublished })),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (p: Paper) => api(`/api/v1/admin/sample-papers/${p.id}`, 'DELETE'),
    onSuccess: () => {
      toast.success('Sample paper deleted');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setForm({
      // Pre-fill from the active filters: adding papers is usually one exam + year at a time.
      examId: exams.find((e) => e.slug === filters.exam)?.id ?? exams[0]?.id ?? '',
      year: filters.year !== ALL ? filters.year : String(defaultYear()),
      subject: '',
      samplePaperLink: '',
      markingSchemeLink: '',
      isPublished: true,
    });
    setEditing('new');
  };
  const openEdit = (p: Paper) => {
    setForm(toForm(p));
    setEditing(p);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sample papers</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            CBSE Class 10 and Class 12 sample papers and marking schemes, shown on the CBSE exam pages at <code>/exams/[exam]/sample-papers</code>. Visitors read PDFs in the on-site viewer; the links
            below are never shown to them. Only published papers appear on the site.
          </p>
        </div>
        <Button onClick={openNew} disabled={exams.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" /> New sample paper
        </Button>
      </div>

      {!isLoading && exams.length === 0 && (
        <p className="mt-4 rounded-lg border border-warning bg-warning/10 p-3 text-sm text-foreground">
          Sample papers are only available for the CBSE Class 10 and Class 12 board exams, and neither is active. Activate them in Curriculum &amp; Exams first.
        </p>
      )}

      <SamplePaperFilters
        filters={filters}
        onChange={setFilters}
        examOptions={examOptions}
        yearOptions={yearOptions}
        subjectOptions={subjectOptions}
        shown={filtered.length}
        total={rows.length}
      />

      <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground">{rows.length ? 'No papers match these filters.' : 'No sample papers yet.'}</p>}
        {filtered.map(({ paper, examName, examSlug, createdByName, downloads }) => (
          <div key={paper.id} className="flex flex-wrap items-center gap-3 p-4">
            <span className="w-16 shrink-0 font-mono text-sm text-muted-foreground">{yearLabel({ slug: examSlug, name: examName }, paper.year)}</span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                {paper.subject}
                {paper.markingSchemeLink && <FileCheck2 className="h-3.5 w-3.5 text-secondary" aria-label="Has marking scheme" />}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {examName} · updated {formatDate(paper.updatedAt)}
                {createdByName ? ` · added by ${createdByName}` : ''}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground" title="Downloads by signed-in users">
              <Download className="h-3.5 w-3.5" /> {downloads.toLocaleString('en-IN')}
            </span>
            <Badge variant={paper.isPublished ? 'success' : 'outline'}>{paper.isPublished ? 'Published' : 'Draft'}</Badge>
            <Switch checked={paper.isPublished} onCheckedChange={() => toggle.mutate(paper)} aria-label="Toggle published" />
            <Button variant="ghost" size="icon" asChild aria-label="View on site" disabled={!paper.isPublished}>
              <a href={samplePapersPath(examSlug, paper.year, paper.subjectSlug)} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openEdit(paper)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              onClick={() => {
                if (confirm(`Delete "${paper.subject} ${yearLabel({ slug: examSlug, name: examName }, paper.year)}" (${examName})?`)) remove.mutate(paper);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'New sample paper' : 'Edit sample paper'}</DialogTitle>
          </DialogHeader>
          {form && (
            <SamplePaperForm
              form={form}
              setForm={setForm}
              exams={exams}
              subjectSuggestions={[...new Set(rows.filter((r) => r.paper.examId === form.examId).map((r) => r.paper.subject))]}
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

function SamplePaperForm({
  form,
  setForm,
  exams,
  subjectSuggestions,
  saving,
  onCancel,
  onSubmit,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  exams: ExamOption[];
  subjectSuggestions: string[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value });
  const exam = exams.find((e) => e.id === form.examId);
  const year = Number(form.year);
  const validYear = Number.isInteger(year) && year >= 2000 && year <= 2100;
  const slug = slugify(form.subject);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
        <div className="space-y-1.5">
          <Label>Exam</Label>
          <Select value={form.examId} onValueChange={(v) => set('examId', v)}>
            <SelectTrigger>
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
          <Label htmlFor="sp-year">Board exam year</Label>
          <Input id="sp-year" type="number" min={2000} max={2100} value={form.year} onChange={(e) => set('year', e.target.value)} required />
          <p className="text-xs text-muted-foreground">{validYear && exam ? `Shown as ${yearLabel(exam, year)}` : 'e.g. 2026'}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sp-subject">Subject</Label>
        <Input
          id="sp-subject"
          value={form.subject}
          onChange={(e) => set('subject', e.target.value)}
          maxLength={120}
          placeholder="Mathematics Standard"
          list="sp-subject-suggestions"
          required
        />
        <datalist id="sp-subject-suggestions">
          {subjectSuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        {exam && slug && validYear && <p className="truncate text-xs text-muted-foreground">Page: {samplePapersPath(exam.slug, year, slug)}</p>}
      </div>

      <PdfLinkField id="sp-paper" label="Sample paper PDF" value={form.samplePaperLink} onChange={(v) => set('samplePaperLink', v)} required />
      <PdfLinkField id="sp-scheme" label="Marking scheme PDF (optional)" value={form.markingSchemeLink} onChange={(v) => set('markingSchemeLink', v)} />

      <div className="flex items-center gap-2">
        <Switch checked={form.isPublished} onCheckedChange={(v) => set('isPublished', v)} id="sp-published" />
        <Label htmlFor="sp-published">Published (visible on the site)</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !form.examId}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

/** A PDF link: paste an http(s) URL, or upload a PDF to the media library to fill it. */
function PdfLinkField({ id, label, value, onChange, required }: { id: string; label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please choose a PDF file');
      return;
    }
    setUploading(true);
    try {
      onChange(await uploadPdf(file));
      toast.success(`Uploaded ${file.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" required={required} />
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="ml-1.5">Upload</span>
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" asChild aria-label="Open link">
            <a href={value} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Filtering ────────────────────────────────────────────────────────────────

function matches(r: Row, f: Filters, ignore?: keyof Filters): boolean {
  return (
    (ignore === 'exam' || f.exam === ALL || r.examSlug === f.exam) &&
    (ignore === 'year' || f.year === ALL || String(r.paper.year) === f.year) &&
    (ignore === 'subject' || f.subject === ALL || r.paper.subjectSlug === f.subject)
  );
}

/**
 * The filtered rows plus each filter's options. An option's count applies every *other*
 * active filter (standard faceted search), so "Physics 2" means picking Physics shows
 * exactly 2 rows. A selected value always stays in its list, even at 0.
 */
function buildFacets(rows: Row[], exams: ExamOption[], f: Filters) {
  const tally = (key: keyof Filters, valueOf: (r: Row) => string) => {
    const counts = new Map<string, number>();
    for (const r of rows) if (matches(r, f, key)) counts.set(valueOf(r), (counts.get(valueOf(r)) ?? 0) + 1);
    return counts;
  };

  // Exams: every eligible exam (so an empty one can be picked to start adding papers) plus
  // any exam that has papers but is no longer active.
  const examCounts = tally('exam', (r) => r.examSlug);
  const examNames = new Map<string, string>(exams.map((e) => [e.slug, e.name]));
  for (const r of rows) if (!examNames.has(r.examSlug)) examNames.set(r.examSlug, r.examName);
  const examOptions: FilterOption[] = [...examNames]
    .map(([slug, name]) => ({ value: slug, label: name, count: examCounts.get(slug) ?? 0 }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const yearCounts = tally('year', (r) => String(r.paper.year));
  const yearValues = new Set([...rows.map((r) => String(r.paper.year)), ...(f.year !== ALL ? [f.year] : [])]);
  const yearOptions: FilterOption[] = [...yearValues]
    .sort((a, b) => Number(b) - Number(a))
    .map((y) => ({ value: y, label: y, count: yearCounts.get(y) ?? 0 }));

  // Subjects keyed by slug (the same subject can exist under several exams); hide ones the
  // other filters rule out entirely to keep the list short, except the selected one.
  const subjectCounts = tally('subject', (r) => r.paper.subjectSlug);
  const subjectNames = new Map<string, string>();
  for (const r of rows) if (!subjectNames.has(r.paper.subjectSlug)) subjectNames.set(r.paper.subjectSlug, r.paper.subject);
  const subjectOptions: FilterOption[] = [...subjectNames]
    .map(([slug, name]) => ({ value: slug, label: name, count: subjectCounts.get(slug) ?? 0 }))
    .filter((o) => o.count > 0 || o.value === f.subject)
    .sort((a, b) => a.label.localeCompare(b.label));

  return { filtered: rows.filter((r) => matches(r, f)), examOptions, yearOptions, subjectOptions };
}
