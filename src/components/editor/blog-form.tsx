'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Check, Eye, Save, Send, Undo2, History, AlertTriangle, PencilLine, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
import { CreateArticleSchema, type CreateArticleInput } from '@/schemas/blog.schema';
import type {
  BlogReadModel, BlogType, ExamClient, SubjectClient, TopicClient, TopicTreeNode, Tag,
} from '@/types';
import { canEditDraft, canSubmitForReview, canWithdrawSubmission, canPublish } from '@/lib/blog-capabilities';
import { cn, slugify } from '@/lib/utils';
import Link from 'next/link';

const BlogEditor = dynamic(
  () => import('@/components/editor/blog-editor').then((m) => m.BlogEditor),
  { ssr: false }
);

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAM_CATEGORY_ORDER = [
  'ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'BANKING', 'GOVERNMENT', 'SCHOOL', 'OTHER',
] as const;

const EXAM_CATEGORY_LABELS: Record<string, string> = {
  ENGINEERING: 'Engineering', MEDICAL: 'Medical', MANAGEMENT: 'Management',
  BANKING: 'Banking', GOVERNMENT: 'Government', SCHOOL: 'School', OTHER: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Approved — ready to publish',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'outline' | 'secondary'> = {
  DRAFT: 'secondary',
  IN_REVIEW: 'outline',
  CHANGES_REQUESTED: 'destructive',
  APPROVED: 'outline',
  PUBLISHED: 'success',
  ARCHIVED: 'secondary',
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchExams(): Promise<ExamClient[]> {
  return (await (await fetch('/api/exams')).json()).data as ExamClient[];
}
async function fetchSubjects(): Promise<SubjectClient[]> {
  return (await (await fetch('/api/subjects')).json()).data as SubjectClient[];
}
function flattenTopicTree(nodes: TopicTreeNode[]): TopicClient[] {
  const result: TopicClient[] = [];
  function walk(node: TopicTreeNode) {
    const { children, inSyllabus, ...topic } = node;
    void children; void inSyllabus;
    result.push(topic as TopicClient);
    (node.children ?? []).forEach(walk);
  }
  nodes.forEach(walk);
  return result;
}
async function fetchTopicsForSubjects(subjectIds: string[]): Promise<Record<string, TopicClient[]>> {
  if (subjectIds.length === 0) return {};
  const entries = await Promise.all(
    subjectIds.map(async (sid) => {
      const res = await fetch(`/api/subjects/${sid}/topics?tree=true`);
      const tree = (await res.json()).data as TopicTreeNode[];
      return [sid, flattenTopicTree(tree)] as [string, TopicClient[]];
    })
  );
  return Object.fromEntries(entries);
}
async function fetchTags(): Promise<Tag[]> {
  return (await (await fetch('/api/tags')).json()).data as Tag[];
}

async function postJson(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error((err.error as string) ?? `Request failed (${res.status})`);
    (e as Error & { status?: number; body?: unknown }).status = res.status;
    (e as Error & { status?: number; body?: unknown }).body = err;
    throw e;
  }
  return (await res.json()).data;
}

// ─── Create mode ────────────────────────────────────────────────────────────

function CreateArticleForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<BlogType>('THEORY');
  const [slugManual, setSlugManual] = useState(false);
  const [slug, setSlug] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: CreateArticleInput = { type, title, slug: slugManual && slug ? slug : undefined };
      return postJson('/api/admin/blogs', 'POST', body) as Promise<BlogReadModel>;
    },
    onSuccess: (readModel) => {
      toast.success('Draft created');
      router.push(`/admin/blogs/${readModel.blog.id}/edit`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
      className="space-y-6 max-w-xl"
    >
      <div className="space-y-2">
        <Label>Article Type <span className="text-destructive">*</span></Label>
        <Select value={type} onValueChange={(v) => setType(v as BlogType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="THEORY">Theory</SelectItem>
            <SelectItem value="QUICK_LEARN">Quick Learn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="create-title">Title <span className="text-destructive">*</span></Label>
        <Input
          id="create-title"
          placeholder="Article title…"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugManual) setSlug(slugify(e.target.value));
          }}
          minLength={3}
          maxLength={160}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Slug</Label>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setSlugManual((v) => !v)}
          >
            {slugManual ? 'Auto-generate' : 'Edit manually'}
          </button>
        </div>
        <Input
          value={slug}
          disabled={!slugManual}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto-generated-from-title"
          className={cn(!slugManual && 'opacity-60')}
        />
      </div>

      <Button type="submit" disabled={createMutation.isPending || title.trim().length < 3} className="gap-1.5">
        <Save className="h-4 w-4" />
        {createMutation.isPending ? 'Creating…' : 'Create Draft'}
      </Button>
    </form>
  );
}

// ─── Edit mode — the working revision editor ─────────────────────────────────

const RevisionFormSchema = z.object({
  title: z.string().min(3).max(160),
  summary: z.string().max(500),
  contentMarkdown: z.string().max(200_000),
  type: z.enum(['THEORY', 'QUICK_LEARN']),
  featuredImageUrl: z.string(),
  featuredImageAlt: z.string(),
  thumbnailUrl: z.string(),
  thumbnailAlt: z.string(),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    canonicalUrl: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImageUrl: z.string().optional(),
    robots: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    twitterTitle: z.string().optional(),
    twitterDescription: z.string().optional(),
    twitterImage: z.string().optional(),
    schemaType: z.string().optional(),
  }),
});
type RevisionFormValues = z.infer<typeof RevisionFormSchema>;

function EditArticleForm({ initial }: { initial: BlogReadModel }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [readModel, setReadModel] = useState(initial);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>(initial.workingRevision?.associations.examIds ?? []);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(initial.workingRevision?.associations.subjectIds ?? []);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(initial.workingRevision?.associations.topicIds ?? []);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initial.workingRevision?.tagIds ?? []);
  const [conflict, setConflict] = useState<{ message: string } | null>(null);
  const cacheKey = `blog-draft-${initial.blog.id}`;
  const [hasCachedDraft, setHasCachedDraft] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { blog, workingRevision, submittedRevision, publishedRevision, lastReviewEvent } = readModel;
  const actor = session?.user ? { id: session.user.id, role: session.user.role } : null;
  const canEdit = actor ? canEditDraft(actor, blog) : false;
  const canSubmit = actor ? canSubmitForReview(actor, blog) : false;
  const canWithdraw = actor ? canWithdrawSubmission(actor, blog) : false;
  const canPublishThis = actor ? canPublish(actor, blog) : false;

  const form = useForm<RevisionFormValues>({
    resolver: zodResolver(RevisionFormSchema),
    defaultValues: {
      title: workingRevision?.title ?? '',
      summary: workingRevision?.summary ?? '',
      contentMarkdown: workingRevision?.contentMarkdown ?? '',
      type: workingRevision?.type ?? 'THEORY',
      featuredImageUrl: workingRevision?.featuredImage?.url ?? '',
      featuredImageAlt: workingRevision?.featuredImage?.alt ?? '',
      thumbnailUrl: workingRevision?.thumbnail?.url ?? '',
      thumbnailAlt: workingRevision?.thumbnail?.alt ?? '',
      seo: workingRevision?.seo ?? {},
    },
  });

  const [slugManual, setSlugManual] = useState(false);
  const [slugValue, setSlugValue] = useState(blog.slug);

  const { data: allExams } = useQuery({ queryKey: ['exams'], queryFn: fetchExams });
  const { data: allSubjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects });
  const { data: topicsMap = {} } = useQuery({
    queryKey: ['blog-topics', selectedSubjectIds.slice().sort().join(',')],
    queryFn: () => fetchTopicsForSubjects(selectedSubjectIds),
    enabled: selectedSubjectIds.length > 0,
  });
  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: fetchTags });

  const examsByCategory = (allExams ?? []).reduce<Record<string, ExamClient[]>>((acc, e) => {
    const cat = e.category ?? 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});

  const watchTitle = form.watch('title');

  // ── localStorage recovery cache (supplemental only — server save is primary) ──
  useEffect(() => {
    if (typeof window === 'undefined' || !workingRevision) return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;
      const cached = JSON.parse(raw) as { savedAt: string };
      const ageMs = Date.now() - new Date(cached.savedAt).getTime();
      if (ageMs > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(cacheKey);
        return;
      }
      setHasCachedDraft(true);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restoreFromCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;
      const cached = JSON.parse(raw) as { formData: Partial<RevisionFormValues> };
      Object.entries(cached.formData).forEach(([k, v]) => {
        form.setValue(k as keyof RevisionFormValues, v as never);
      });
      setHasCachedDraft(false);
      toast.success('Draft restored from browser cache');
    } catch { /* ignore */ }
  }, [cacheKey, form]);

  const discardCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
    setHasCachedDraft(false);
  }, [cacheKey]);

  const saveToCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ formData: form.getValues(), savedAt: new Date().toISOString() }));
    } catch { /* ignore quota errors */ }
  }, [cacheKey, form]);

  useEffect(() => {
    if (!canEdit) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(saveToCache, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveToCache, canEdit, form.watch('title'), form.watch('contentMarkdown'), form.watch('summary')]);

  // ── Save (PATCH) ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (data: RevisionFormValues) => {
      if (!workingRevision) throw new Error('There is no editable draft to save.');
      const payload = {
        expectedVersion: workingRevision.version,
        title: data.title,
        slug: slugManual && slugValue !== blog.slug ? slugValue : undefined,
        summary: data.summary,
        contentMarkdown: data.contentMarkdown,
        type: data.type,
        featuredImage: data.featuredImageUrl ? { url: data.featuredImageUrl, alt: data.featuredImageAlt } : null,
        thumbnail: data.thumbnailUrl ? { url: data.thumbnailUrl, alt: data.thumbnailAlt } : null,
        tagIds: selectedTagIds,
        associations: { examIds: selectedExamIds, subjectIds: selectedSubjectIds, topicIds: selectedTopicIds },
        seo: data.seo,
      };
      return postJson(`/api/admin/blogs/${blog.id}`, 'PATCH', payload) as Promise<BlogReadModel>;
    },
    onSuccess: (updated) => {
      setReadModel(updated);
      setConflict(null);
      localStorage.removeItem(cacheKey);
      toast.success('Saved');
    },
    onError: (err: Error & { status?: number }) => {
      if (err.status === 409) {
        setConflict({ message: err.message });
        toast.error('Save conflict — see the banner above the editor');
      } else {
        toast.error(err.message);
      }
    },
  });

  const workflowMutation = useMutation({
    mutationFn: async (action: 'submit' | 'withdraw' | 'start-new-revision' | 'publish') => {
      const routes: Record<typeof action, [string, string]> = {
        submit: [`/api/admin/blogs/${blog.id}/submit`, 'POST'],
        withdraw: [`/api/admin/blogs/${blog.id}/submit`, 'DELETE'],
        'start-new-revision': [`/api/admin/blogs/${blog.id}/edit`, 'POST'],
        publish: [`/api/admin/blogs/${blog.id}/publish`, 'POST'],
      };
      const [url, method] = routes[action];
      return postJson(url, method) as Promise<BlogReadModel>;
    },
    onSuccess: (updated, action) => {
      setReadModel(updated);
      const messages: Record<string, string> = {
        submit: 'Submitted for review',
        withdraw: 'Submission withdrawn — back to draft',
        'start-new-revision': 'Started a new draft from the published version',
        publish: 'Published',
      };
      toast.success(messages[action] ?? 'Done');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleTitleChange = (v: string) => {
    form.setValue('title', v);
  };

  const toggleExam = (id: string) =>
    setSelectedExamIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleSubject = (id: string) => {
    const removing = selectedSubjectIds.includes(id);
    setSelectedSubjectIds((p) => removing ? p.filter((x) => x !== id) : [...p, id]);
    if (removing) {
      const subjectTopics = (topicsMap[id] ?? []).map((t) => t.id);
      setSelectedTopicIds((p) => p.filter((tid) => !subjectTopics.includes(tid)));
    }
  };
  const toggleTopic = (id: string) =>
    setSelectedTopicIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleTag = (id: string) =>
    setSelectedTagIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleSave = form.handleSubmit((data) => saveMutation.mutate(data));
  const handlePreview = () => window.open(`/admin/blogs/${blog.id}/preview`, '_blank');

  // ── Read-only states: no working revision the viewer can edit ────────────
  if (!workingRevision) {
    const canStartNew = blog.status === 'PUBLISHED' && canEdit;
    const relevantRevision = submittedRevision ?? publishedRevision;
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={STATUS_VARIANT[blog.status]}>{STATUS_LABELS[blog.status]}</Badge>
          <span className="text-sm text-muted-foreground">by {blog.authorNameSnapshot}</span>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <p className="text-sm">
            {blog.status === 'IN_REVIEW' && 'This revision is submitted and awaiting a reviewer — it is read-only until changes are requested or the submission is withdrawn.'}
            {blog.status === 'APPROVED' && 'This revision was approved and is waiting to be published.'}
            {blog.status === 'PUBLISHED' && 'This article is live. Start a new draft to make further edits — the public page will keep showing the current version until you publish again.'}
            {blog.status === 'ARCHIVED' && 'This article is archived. An admin can restore it before it can be edited again.'}
          </p>
          {relevantRevision && <p className="text-sm font-medium">{relevantRevision.title}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handlePreview} className="gap-1.5">
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button type="button" variant="outline" asChild className="gap-1.5">
            <Link href={`/admin/blogs/${blog.id}/history`}><History className="h-4 w-4" /> History</Link>
          </Button>
          {blog.status === 'IN_REVIEW' && canWithdraw && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => workflowMutation.mutate('withdraw')}
              disabled={workflowMutation.isPending}
              className="gap-1.5"
            >
              <Undo2 className="h-4 w-4" /> Withdraw submission
            </Button>
          )}
          {blog.status === 'APPROVED' && canPublishThis && (
            <Button
              type="button"
              onClick={() => workflowMutation.mutate('publish')}
              disabled={workflowMutation.isPending}
              className="gap-1.5"
            >
              <Rocket className="h-4 w-4" /> Publish
            </Button>
          )}
          {blog.status === 'APPROVED' && !canPublishThis && actor?.id === blog.authorId && (
            <p className="text-sm text-muted-foreground">
              You authored this article — a different reviewer or admin must publish it.
            </p>
          )}
          {canStartNew && (
            <Button
              type="button"
              onClick={() => workflowMutation.mutate('start-new-revision')}
              disabled={workflowMutation.isPending}
              className="gap-1.5"
            >
              <PencilLine className="h-4 w-4" /> Start new draft
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conflict && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm" role="alert">
          <span className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {conflict.message}
          </span>
          <Button size="sm" variant="outline" onClick={() => router.refresh()}>Reload latest</Button>
        </div>
      )}

      {hasCachedDraft && (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-2.5 text-sm">
          <span className="text-amber-800 dark:text-amber-300">You have an unsaved draft in browser cache.</span>
          <div className="flex gap-2 ml-4">
            <Button size="sm" variant="outline" onClick={restoreFromCache}>Restore</Button>
            <Button size="sm" variant="ghost" onClick={discardCache}>Discard</Button>
          </div>
        </div>
      )}

      {lastReviewEvent?.action === 'CHANGES_REQUESTED' && lastReviewEvent.note && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm space-y-1">
          <p className="font-medium text-amber-800 dark:text-amber-300">Reviewer requested changes:</p>
          <p className="text-amber-800/90 dark:text-amber-300/90">{lastReviewEvent.note}</p>
        </div>
      )}

      <form onSubmit={handleSave}>
        <Tabs defaultValue="content" className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="taxonomy">Taxonomy</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>
              <Badge variant={STATUS_VARIANT[blog.status]}>{STATUS_LABELS[blog.status]}</Badge>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button type="button" variant="outline" size="sm" onClick={handlePreview} className="gap-1.5">
                <Eye className="h-4 w-4" /> Preview
              </Button>
              {canEdit && (
                <Button type="submit" size="sm" disabled={saveMutation.isPending} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? 'Saving…' : 'Save'}
                </Button>
              )}
              {canSubmit && (blog.status === 'DRAFT' || blog.status === 'CHANGES_REQUESTED') && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => workflowMutation.mutate('submit')}
                  disabled={workflowMutation.isPending}
                  className="gap-1.5"
                >
                  <Send className="h-4 w-4" /> Submit for review
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/admin/blogs')}>
                Back to list
              </Button>
            </div>
          </div>

          {/* ── Content Tab ───────────────────────────────────────────── */}
          <TabsContent value="content" className="space-y-6">
            <div className="space-y-2">
              <Label>Article Type <span className="text-destructive">*</span></Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!canEdit}>
                    <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THEORY">Theory</SelectItem>
                      <SelectItem value="QUICK_LEARN">Quick Learn</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="edit-title"
                placeholder="Article title…"
                value={watchTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={!canEdit}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Slug</Label>
                {canEdit && (
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setSlugManual((v) => !v)}>
                    {slugManual ? 'Cancel' : 'Change slug'}
                  </button>
                )}
              </div>
              <Input
                value={slugValue}
                disabled={!slugManual || !canEdit}
                onChange={(e) => setSlugValue(e.target.value)}
                className={cn((!slugManual || !canEdit) && 'opacity-60')}
              />
              {slugManual && blog.publishedAt && (
                <p className="text-xs text-muted-foreground">
                  This article has been published before — the old slug will permanently redirect here once saved.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Summary <span className="text-muted-foreground text-xs">(required to submit for review)</span></Label>
              <Controller
                control={form.control}
                name="summary"
                render={({ field }) => <Textarea {...field} rows={3} placeholder="Short excerpt for listing cards…" disabled={!canEdit} />}
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Controller
                control={form.control}
                name="contentMarkdown"
                render={({ field }) => (
                  <BlogEditor
                    value={field.value}
                    onChange={canEdit ? field.onChange : undefined}
                    placeholder="Start writing…"
                    className="min-h-[420px]"
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Featured Image URL</Label>
                <Controller control={form.control} name="featuredImageUrl" render={({ field }) => <Input {...field} placeholder="https://…" disabled={!canEdit} />} />
              </div>
              <div className="space-y-2">
                <Label>Featured Image Alt Text <span className="text-muted-foreground text-xs">(required to publish)</span></Label>
                <Controller control={form.control} name="featuredImageAlt" render={({ field }) => <Input {...field} disabled={!canEdit} />} />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Controller control={form.control} name="thumbnailUrl" render={({ field }) => <Input {...field} placeholder="https://…" disabled={!canEdit} />} />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail Alt Text</Label>
                <Controller control={form.control} name="thumbnailAlt" render={({ field }) => <Input {...field} disabled={!canEdit} />} />
              </div>
            </div>
          </TabsContent>

          {/* ── Taxonomy Tab ──────────────────────────────────────────── */}
          <TabsContent value="taxonomy" className="space-y-6">
            <div className="space-y-3">
              <div>
                <Label>Exams <span className="text-muted-foreground text-xs">(editorial association, not syllabus eligibility)</span></Label>
              </div>
              {allExams && allExams.length > 0 ? (
                <div className="space-y-4">
                  {EXAM_CATEGORY_ORDER.filter((cat) => examsByCategory[cat]).map((category) => (
                    <div key={category}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                        {EXAM_CATEGORY_LABELS[category]}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {examsByCategory[category].map((exam) => {
                          const selected = selectedExamIds.includes(exam.id);
                          return (
                            <button
                              key={exam.id}
                              type="button"
                              disabled={!canEdit}
                              onClick={() => toggleExam(exam.id)}
                              className={cn(
                                'relative rounded-xl border-2 p-2.5 text-left transition-all disabled:opacity-60',
                                selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                              )}
                            >
                              {selected && (
                                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                </span>
                              )}
                              <p className="font-medium text-xs pr-5 leading-snug">{exam.name}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No exams configured yet.</p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {(allSubjects ?? []).map((subject) => {
                  const selected = selectedSubjectIds.includes(subject.id);
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => toggleSubject(subject.id)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
                        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                      )}
                    >
                      {subject.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedSubjectIds.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label>Topics</Label>
                  {selectedSubjectIds.map((sid) => {
                    const subject = (allSubjects ?? []).find((s) => s.id === sid);
                    const topics: TopicClient[] = topicsMap[sid] ?? [];
                    if (topics.length === 0) return null;
                    return (
                      <div key={sid} className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{subject?.name ?? sid}</p>
                        <div className="flex flex-wrap gap-2">
                          {topics.map((topic) => {
                            const selected = selectedTopicIds.includes(topic.id);
                            return (
                              <button
                                key={topic.id}
                                type="button"
                                disabled={!canEdit}
                                onClick={() => toggleTopic(topic.id)}
                                className={cn(
                                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
                                  selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
                                  topic.depth === 1 && 'ml-3', topic.depth === 2 && 'ml-6'
                                )}
                              >
                                {topic.depth > 0 && <span className="opacity-50 mr-1">{'›'.repeat(topic.depth)}</span>}
                                {topic.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-3">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {(allTags ?? []).map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60',
                        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                {(allTags ?? []).length === 0 && <p className="text-sm text-muted-foreground">No tags found.</p>}
              </div>
            </div>
          </TabsContent>

          {/* ── SEO Tab ───────────────────────────────────────────────── */}
          <TabsContent value="seo" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Meta Title <span className="text-muted-foreground text-xs">(max 160, defaults to title)</span></Label>
                <Controller control={form.control} name="seo.metaTitle" render={({ field }) => <Input {...field} disabled={!canEdit} />} />
              </div>
              <div className="space-y-2">
                <Label>Meta Description <span className="text-muted-foreground text-xs">(max 320, defaults to summary)</span></Label>
                <Controller control={form.control} name="seo.metaDescription" render={({ field }) => <Textarea {...field} rows={2} disabled={!canEdit} />} />
              </div>
              <div className="space-y-2">
                <Label>Keywords <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                <Controller
                  control={form.control}
                  name="seo.keywords"
                  render={({ field }) => (
                    <Input
                      value={(field.value ?? []).join(', ')}
                      onChange={(e) => field.onChange(e.target.value.split(',').map((k) => k.trim()).filter(Boolean))}
                      disabled={!canEdit}
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Canonical URL <span className="text-muted-foreground text-xs">(leave blank to default to /blogs/[slug])</span></Label>
                <Controller control={form.control} name="seo.canonicalUrl" render={({ field }) => <Input {...field} placeholder="https://scholar247.org/blogs/…" disabled={!canEdit} />} />
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Open Graph</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>OG Title</Label>
                  <Controller control={form.control} name="seo.ogTitle" render={({ field }) => <Input {...field} disabled={!canEdit} />} />
                </div>
                <div className="space-y-2">
                  <Label>OG Image URL</Label>
                  <Controller control={form.control} name="seo.ogImageUrl" render={({ field }) => <Input {...field} placeholder="https://…" disabled={!canEdit} />} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>OG Description</Label>
                  <Controller control={form.control} name="seo.ogDescription" render={({ field }) => <Textarea {...field} rows={2} disabled={!canEdit} />} />
                </div>
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Twitter Card</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Twitter Title</Label>
                  <Controller control={form.control} name="seo.twitterTitle" render={({ field }) => <Input {...field} disabled={!canEdit} />} />
                </div>
                <div className="space-y-2">
                  <Label>Twitter Image URL</Label>
                  <Controller control={form.control} name="seo.twitterImage" render={({ field }) => <Input {...field} placeholder="https://…" disabled={!canEdit} />} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Twitter Description</Label>
                  <Controller control={form.control} name="seo.twitterDescription" render={({ field }) => <Textarea {...field} rows={2} disabled={!canEdit} />} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Robots</Label>
                  <Controller
                    control={form.control}
                    name="seo.robots"
                    render={({ field }) => (
                      <Select value={field.value || 'index,follow'} onValueChange={field.onChange} disabled={!canEdit}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="index,follow">index,follow</SelectItem>
                          <SelectItem value="noindex,nofollow">noindex,nofollow</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Schema Type</Label>
                  <Controller
                    control={form.control}
                    name="seo.schemaType"
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={!canEdit}>
                        <SelectTrigger><SelectValue placeholder="Select schema" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Article">Article</SelectItem>
                          <SelectItem value="BlogPosting">BlogPosting</SelectItem>
                          <SelectItem value="HowTo">HowTo</SelectItem>
                          <SelectItem value="FAQPage">FAQPage</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Info Tab ──────────────────────────────────────────────── */}
          <TabsContent value="info" className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Author</Label>
              <div className="flex items-center h-9 px-3 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                {blog.authorNameSnapshot}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Last saved</Label>
              <div className="flex items-center h-9 px-3 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                {new Date(workingRevision.updatedAt).toLocaleString()}
              </div>
            </div>
            {blog.publishedAt && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">First published</Label>
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                  {new Date(blog.publishedAt).toLocaleString()}
                </div>
              </div>
            )}
            {lastReviewEvent && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Last activity</Label>
                <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-1">
                  <p>{lastReviewEvent.action.replace(/_/g, ' ').toLowerCase()} — {new Date(lastReviewEvent.createdAt).toLocaleString()}</p>
                  {lastReviewEvent.note && <p className="text-muted-foreground italic">"{lastReviewEvent.note}"</p>}
                </div>
              </div>
            )}
            <Button type="button" variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/admin/blogs/${blog.id}/history`}><History className="h-4 w-4" /> Full history</Link>
            </Button>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

interface BlogFormProps {
  mode: 'create' | 'edit';
  initialReadModel?: BlogReadModel;
}

export function BlogForm({ mode, initialReadModel }: BlogFormProps) {
  if (mode === 'create' || !initialReadModel) return <CreateArticleForm />;
  return <EditArticleForm initial={initialReadModel} />;
}
