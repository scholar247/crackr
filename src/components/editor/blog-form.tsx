'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Check, Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateBlogSchema, type CreateBlogInput } from '@/schemas/blog.schema';
import type { BlogClient, ExamClient, SubjectClient, TopicClient, TopicTreeNode, Tag } from '@/types';
import { cn, slugify } from '@/lib/utils';

const BlogEditor = dynamic(
  () => import('@/components/editor/blog-editor').then((m) => m.BlogEditor),
  { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogFormProps {
  initialData?: BlogClient;
  mode: 'create' | 'edit';
}

interface DraftCache {
  formData: Partial<CreateBlogInput>;
  selectedExamIds: string[];
  selectedSubjectIds: string[];
  selectedTopicIds: string[];
  selectedTagIds: string[];
  savedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAM_CATEGORY_ORDER = [
  'ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'BANKING', 'GOVERNMENT', 'SCHOOL', 'OTHER',
] as const;

const EXAM_CATEGORY_LABELS: Record<string, string> = {
  ENGINEERING: 'Engineering', MEDICAL: 'Medical', MANAGEMENT: 'Management',
  BANKING: 'Banking', GOVERNMENT: 'Government', SCHOOL: 'School', OTHER: 'Other',
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, inSyllabus, ...topic } = node;
    result.push(topic as TopicClient);
    (children ?? []).forEach(walk);
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

// ─── Component ────────────────────────────────────────────────────────────────

export function BlogForm({ initialData, mode }: BlogFormProps) {
  const router = useRouter();
  const cacheKey = mode === 'edit' && initialData?.id
    ? `blog-draft-${initialData.id}`
    : 'blog-draft-new';

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>(initialData?.examIds ?? []);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(initialData?.subjectIds ?? []);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(initialData?.topicIds ?? []);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds ?? []);
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [hasCachedDraft, setHasCachedDraft] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Form ───────────────────────────────────────────────────────────────────
  const form = useForm<CreateBlogInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CreateBlogSchema) as any,
    defaultValues: initialData
      ? {
          type: initialData.type,
          title: initialData.title,
          slug: initialData.slug,
          summary: initialData.summary ?? '',
          content: initialData.content ?? '',
          examIds: initialData.examIds,
          subjectIds: initialData.subjectIds,
          topicIds: initialData.topicIds,
          relatedBlogIds: initialData.relatedBlogIds,
          tagIds: initialData.tagIds ?? [],
          featuredImage: initialData.featuredImage ?? '',
          thumbnail: initialData.thumbnail ?? '',
          seo: initialData.seo ?? {},
          status: initialData.status,
        }
      : {
          type: 'THEORY',
          title: '',
          slug: '',
          summary: '',
          content: '',
          examIds: [],
          subjectIds: [],
          topicIds: [],
          relatedBlogIds: [],
          tagIds: [],
          featuredImage: '',
          thumbnail: '',
          seo: {},
          status: 'DRAFT',
        },
  });

  // ── Queries ────────────────────────────────────────────────────────────────
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

  // ── localStorage — detect draft on mount ──────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;
      const draft: DraftCache = JSON.parse(raw);
      const ageMs = Date.now() - new Date(draft.savedAt).getTime();
      if (ageMs > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(cacheKey);
        return;
      }
      setHasCachedDraft(true);
    } catch { /* ignore */ }
  // only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restoreFromCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;
      const draft: DraftCache = JSON.parse(raw);
      Object.entries(draft.formData).forEach(([k, v]) => {
        form.setValue(k as keyof CreateBlogInput, v as never);
      });
      setSelectedExamIds(draft.selectedExamIds);
      setSelectedSubjectIds(draft.selectedSubjectIds);
      setSelectedTopicIds(draft.selectedTopicIds);
      setSelectedTagIds(draft.selectedTagIds);
      setHasCachedDraft(false);
      toast.success('Draft restored from browser cache');
    } catch { /* ignore */ }
  }, [cacheKey, form]);

  const discardCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
    setHasCachedDraft(false);
  }, [cacheKey]);

  // ── localStorage — auto-save on changes ───────────────────────────────────
  const saveToCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const draft: DraftCache = {
        formData: form.getValues(),
        selectedExamIds,
        selectedSubjectIds,
        selectedTopicIds,
        selectedTagIds,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(draft));
    } catch { /* ignore quota errors */ }
  }, [cacheKey, form, selectedExamIds, selectedSubjectIds, selectedTopicIds, selectedTagIds]);

  // Debounce: save 1.5s after last change
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(saveToCache, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [saveToCache,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    form.watch('title'), form.watch('content'), form.watch('summary'),
    selectedExamIds, selectedSubjectIds, selectedTopicIds, selectedTagIds,
  ]);

  // ── Save mutation ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (data: CreateBlogInput & { _redirectAfter?: string }) => {
      const { _redirectAfter, ...payload } = data;
      const url = mode === 'edit' ? `/api/admin/blogs/${initialData!.id}` : '/api/admin/blogs';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          examIds: selectedExamIds,
          subjectIds: selectedSubjectIds,
          topicIds: selectedTopicIds,
          tagIds: selectedTagIds,
        }),
      });
      if (!res.ok) {
        let errBody: Record<string, unknown> = {};
        try { errBody = await res.json(); } catch { /* */ }
        throw new Error((errBody.error as string) ?? `Request failed (${res.status})`);
      }
      const json = await res.json();
      return { blog: json.data, redirectAfter: _redirectAfter };
    },
    onSuccess: ({ blog, redirectAfter }) => {
      localStorage.removeItem(cacheKey);
      if (redirectAfter === 'preview') {
        const previewId = blog?.id ?? initialData?.id;
        if (previewId) window.open(`/admin/blogs/${previewId}/preview`, '_blank');
        if (mode === 'create' && blog?.id) {
          router.replace(`/admin/blogs/${blog.id}/edit`);
        }
        toast.success('Saved — opening preview');
      } else {
        toast.success(mode === 'create' ? 'Blog created!' : 'Blog updated!');
        router.push('/admin/blogs');
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Slug ───────────────────────────────────────────────────────────────────
  const handleTitleChange = (v: string) => {
    form.setValue('title', v);
    if (!slugManual) form.setValue('slug', slugify(v));
  };

  // ── Toggles ────────────────────────────────────────────────────────────────
  const toggleExam = (id: string) =>
    setSelectedExamIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleSubject = (id: string) => {
    const removing = selectedSubjectIds.includes(id);
    setSelectedSubjectIds((p) => removing ? p.filter((x) => x !== id) : [...p, id]);
    if (removing) {
      // Drop topics that belong to the removed subject
      const subjectTopics = (topicsMap[id] ?? []).map((t) => t.id);
      setSelectedTopicIds((p) => p.filter((tid) => !subjectTopics.includes(tid)));
    }
  };

  const toggleTopic = (id: string) =>
    setSelectedTopicIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleTag = (id: string) =>
    setSelectedTagIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = form.handleSubmit((data) => {
    saveMutation.mutate({ ...data, examIds: selectedExamIds, subjectIds: selectedSubjectIds, topicIds: selectedTopicIds, tagIds: selectedTagIds });
  });

  const handlePreview = () => {
    // Edit mode with existing ID: open preview directly
    if (mode === 'edit' && initialData?.id) {
      window.open(`/admin/blogs/${initialData.id}/preview`, '_blank');
      return;
    }
    // Create mode or no ID yet: save first then open preview
    form.handleSubmit((data) => {
      saveMutation.mutate({
        ...data,
        examIds: selectedExamIds,
        subjectIds: selectedSubjectIds,
        topicIds: selectedTopicIds,
        tagIds: selectedTagIds,
        _redirectAfter: 'preview',
      } as CreateBlogInput & { _redirectAfter: string });
    })();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* AI Content Factory: this blog is only a stub — Blog Generator hasn't filled in content yet */}
      {mode === 'edit' && initialData?.status === 'SEEDING' && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-4 py-2.5 text-sm text-blue-800 dark:text-blue-300">
          This blog was created by the AI Content Factory&apos;s <strong>Blog Seeder</strong> — title, slug, and
          summary only, content is intentionally empty at this stage. Run <strong>Blog Generator</strong>{' '}
          (Admin → AI Content Factory → Seed Monitor) to fill in the full article, or write it manually below.
        </div>
      )}

      {/* Cached draft restore banner */}
      {hasCachedDraft && (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-2.5 text-sm">
          <span className="text-amber-800 dark:text-amber-300">
            You have an unsaved draft in browser cache.
          </span>
          <div className="flex gap-2 ml-4">
            <Button size="sm" variant="outline" onClick={restoreFromCache}>Restore</Button>
            <Button size="sm" variant="ghost" onClick={discardCache}>Discard</Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave}>
        <Tabs defaultValue="content" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="taxonomy">Taxonomy</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Action buttons — always visible */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={saveMutation.isPending}
                className="gap-1.5"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saveMutation.isPending}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? 'Saving…' : mode === 'create' ? 'Create Blog' : 'Save Changes'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </div>

          {/* ── Content Tab ───────────────────────────────────────────── */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Blog Type <span className="text-destructive">*</span></Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THEORY">Theory</SelectItem>
                        <SelectItem value="QUICK_LEARN">Quick Learn</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Blog post title…"
                value={watchTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
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
              <Controller
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <Input
                    {...field}
                    disabled={!slugManual}
                    placeholder="auto-generated-from-title"
                    className={cn(!slugManual && 'opacity-60')}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Summary <span className="text-muted-foreground text-xs">(shown in cards)</span></Label>
              <Controller
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <Textarea {...field} rows={3} placeholder="Short excerpt for listing cards…" />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Controller
                control={form.control}
                name="content"
                render={({ field }) => (
                  <BlogEditor
                    value={field.value as string}
                    onChange={field.onChange}
                    placeholder="Start writing your blog post…"
                    className="min-h-[420px]"
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Featured Image URL</Label>
                <Controller control={form.control} name="featuredImage" render={({ field }) => <Input {...field} placeholder="https://…" />} />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Controller control={form.control} name="thumbnail" render={({ field }) => <Input {...field} placeholder="https://…" />} />
              </div>
            </div>
          </TabsContent>

          {/* ── Taxonomy Tab ──────────────────────────────────────────── */}
          <TabsContent value="taxonomy" className="space-y-6">

            {/* Exams */}
            <div className="space-y-3">
              <div>
                <Label>Exams</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Select all exams this blog is relevant to.</p>
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
                              onClick={() => toggleExam(exam.id)}
                              className={cn(
                                'relative rounded-xl border-2 p-2.5 text-left transition-all',
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

            {/* Subjects */}
            <div className="space-y-3">
              <Label>Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {(allSubjects ?? []).map((subject) => {
                  const selected = selectedSubjectIds.includes(subject.id);
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => toggleSubject(subject.id)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                      )}
                    >
                      {subject.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topics — shown only when subjects are selected */}
            {selectedSubjectIds.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <Label>Topics</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Select specific topics this blog covers.</p>
                  </div>
                  {selectedSubjectIds.map((sid) => {
                    const subject = (allSubjects ?? []).find((s) => s.id === sid);
                    const topics: TopicClient[] = topicsMap[sid] ?? [];
                    if (topics.length === 0) return null;
                    return (
                      <div key={sid} className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                          {subject?.name ?? sid}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {topics.map((topic) => {
                            const selected = selectedTopicIds.includes(topic.id);
                            return (
                              <button
                                key={topic.id}
                                type="button"
                                onClick={() => toggleTopic(topic.id)}
                                className={cn(
                                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                  selected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
                                  topic.depth === 1 && 'ml-3',
                                  topic.depth === 2 && 'ml-6'
                                )}
                              >
                                {topic.depth > 0 && (
                                  <span className="opacity-50 mr-1">{'›'.repeat(topic.depth)}</span>
                                )}
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

            {/* Tags */}
            <div className="space-y-3">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {(allTags ?? []).map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                {(allTags ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags found.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── SEO Tab ───────────────────────────────────────────────── */}
          <TabsContent value="seo" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Meta Title <span className="text-muted-foreground text-xs">(max 160)</span></Label>
                <Controller control={form.control} name="seo.metaTitle" render={({ field }) => <Input {...field} placeholder="SEO title (defaults to blog title)" />} />
              </div>

              <div className="space-y-2">
                <Label>Meta Description <span className="text-muted-foreground text-xs">(max 320)</span></Label>
                <Controller control={form.control} name="seo.metaDescription" render={({ field }) => <Textarea {...field} rows={2} placeholder="SEO description…" />} />
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
                      placeholder="jee, physics, kinematics"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Canonical URL</Label>
                <Controller control={form.control} name="seo.canonicalUrl" render={({ field }) => <Input {...field} placeholder="https://scholar247.org/blogs/…" />} />
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Open Graph</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>OG Title</Label>
                  <Controller control={form.control} name="seo.ogTitle" render={({ field }) => <Input {...field} />} />
                </div>
                <div className="space-y-2">
                  <Label>OG Image URL</Label>
                  <Controller control={form.control} name="seo.ogImage" render={({ field }) => <Input {...field} placeholder="https://…" />} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>OG Description</Label>
                  <Controller control={form.control} name="seo.ogDescription" render={({ field }) => <Textarea {...field} rows={2} />} />
                </div>
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Twitter Card</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Twitter Title</Label>
                  <Controller control={form.control} name="seo.twitterTitle" render={({ field }) => <Input {...field} />} />
                </div>
                <div className="space-y-2">
                  <Label>Twitter Image URL</Label>
                  <Controller control={form.control} name="seo.twitterImage" render={({ field }) => <Input {...field} placeholder="https://…" />} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Twitter Description</Label>
                  <Controller control={form.control} name="seo.twitterDescription" render={({ field }) => <Textarea {...field} rows={2} />} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Robots</Label>
                  <Controller control={form.control} name="seo.robots" render={({ field }) => <Input {...field} placeholder="index,follow" />} />
                </div>
                <div className="space-y-2">
                  <Label>Schema Type</Label>
                  <Controller
                    control={form.control}
                    name="seo.schemaType"
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
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

          {/* ── Settings Tab ──────────────────────────────────────────── */}
          <TabsContent value="settings" className="space-y-6">
            {mode === 'edit' && initialData?.creatorEmail && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Created by</Label>
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                  {initialData.creatorEmail}
                </div>
              </div>
            )}

            {mode === 'edit' && initialData?.publishedAt && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Published at</Label>
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                  {new Date(initialData.publishedAt).toLocaleString()}
                </div>
              </div>
            )}

            {mode === 'edit' && initialData?.slugHistory && initialData.slugHistory.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Previous Slugs</Label>
                <div className="rounded-md border bg-muted/20 p-3 space-y-1">
                  {initialData.slugHistory.map((h, i) => (
                    <p key={i} className="text-xs font-mono text-muted-foreground">
                      /{h.slug}
                      <span className="ml-2 opacity-60">→ {new Date(h.replacedAt).toLocaleDateString()}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
