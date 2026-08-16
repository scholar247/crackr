'use client';

import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Save, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreateArticleSchema,
  ARTICLE_STATUS_VALUES,
  ARTICLE_VISIBILITY_VALUES,
  ARTICLE_TYPE_VALUES,
  type CreateArticleInput,
} from '@/schemas/article.schema';
import { cn, slugify, STATUS_COLORS } from '@/lib/utils';

const BlogEditor = dynamic(() => import('@/components/editor/blog-editor').then((m) => m.BlogEditor), { ssr: false });

const ARTICLE_TYPE_LABELS: Record<(typeof ARTICLE_TYPE_VALUES)[number], string> = {
  GENERAL: 'General',
  CONCEPT: 'Concept',
  SOLUTION: 'Solution',
  TIPS_AND_TRICKS: 'Tips & Tricks',
  FORMULA: 'Formula',
  NEWS: 'News',
  COURSE_CONTENT: 'Course Content',
};

interface ArticleRecord {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  status: (typeof ARTICLE_STATUS_VALUES)[number];
  visibility: (typeof ARTICLE_VISIBILITY_VALUES)[number];
  articleType: (typeof ARTICLE_TYPE_VALUES)[number];
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[] | null;
  ogImage: string | null;
  nodeId?: string | null;
  updatedAt: string;
}

interface CurriculumNode {
  id: string;
  nodeType: 'SUBJECT' | 'CHAPTER' | 'TOPIC' | 'SUBTOPIC';
  name: string;
}

async function postJson(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err.error as string) ?? `Request failed (${res.status})`);
  }
  return (await res.json()).data as ArticleRecord;
}

interface BlogFormProps {
  mode: 'create' | 'edit';
  initial?: ArticleRecord;
}

export function BlogForm({ mode, initial }: BlogFormProps) {
  const router = useRouter();
  const [slugManual, setSlugManual] = useState(false);
  const [slugValue, setSlugValue] = useState(initial?.slug ?? '');
  const [editorView, setEditorView] = useState<'rich' | 'markdown'>('rich');
  const [metaTitleManual, setMetaTitleManual] = useState(false);
  const [metaTitleValue, setMetaTitleValue] = useState(initial?.metaTitle ?? '');
  const [metaDescManual, setMetaDescManual] = useState(false);
  const [metaDescValue, setMetaDescValue] = useState(initial?.metaDescription ?? '');
  const [keywordsValue, setKeywordsValue] = useState((initial?.keywords ?? []).join(', '));
  const [nodeId, setNodeId] = useState<string | undefined>(initial?.nodeId ?? undefined);
  const [nodeSearch, setNodeSearch] = useState('');

  // Flat, filterable curriculum node list — same public endpoint the practice/exam pages
  // use. Fetched once and searched client-side; simpler than a per-exam cascading picker
  // since articles aren't tied to one exam the way questions are.
  const { data: nodeOptions = [] } = useQuery<CurriculumNode[]>({
    queryKey: ['public-nodes'],
    queryFn: () => fetch('/api/v1/public/nodes').then((res) => res.json()).then((json) => json.data),
    staleTime: 5 * 60 * 1000,
  });
  const selectedNode = useMemo(() => nodeOptions.find((n) => n.id === nodeId), [nodeOptions, nodeId]);
  const filteredNodes = useMemo(() => {
    if (!nodeSearch.trim()) return [];
    const q = nodeSearch.trim().toLowerCase();
    return nodeOptions.filter((n) => n.name.toLowerCase().includes(q)).slice(0, 30);
  }, [nodeOptions, nodeSearch]);

  const form = useForm<CreateArticleInput>({
    // z.default() makes the schema's own inferred type disagree with zodResolver's
    // generic inference (input vs. output shape) — defaultValues below already
    // supplies every field, so this cast is safe.
    resolver: zodResolver(CreateArticleSchema) as Resolver<CreateArticleInput>,
    defaultValues: {
      title: initial?.title ?? '',
      summary: initial?.summary ?? '',
      body: initial?.body ?? '',
      status: initial?.status ?? 'DRAFT',
      visibility: initial?.visibility ?? 'PRIVATE',
      articleType: initial?.articleType ?? 'GENERAL',
      ogImage: initial?.ogImage ?? '',
    },
  });

  const watchTitle = form.watch('title');

  const mutation = useMutation({
    mutationFn: (data: CreateArticleInput) => {
      const keywords = keywordsValue
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      const payload = {
        ...data,
        slug: slugManual && slugValue ? slugValue : undefined,
        metaTitle: metaTitleManual && metaTitleValue ? metaTitleValue : undefined,
        metaDescription: metaDescManual && metaDescValue ? metaDescValue : undefined,
        keywords: keywords.length ? keywords : undefined,
        nodeId,
      };
      return mode === 'create'
        ? postJson('/api/v1/admin/blog', 'POST', payload)
        : postJson(`/api/v1/admin/blog/${initial!.id}`, 'PATCH', payload);
    },
    onSuccess: (article) => {
      toast.success(mode === 'create' ? 'Article created' : 'Saved');
      if (mode === 'create') router.push(`/admin/blog/${article.id}/edit`);
      else router.refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {initial && <Badge className={STATUS_COLORS[initial.status]}>{initial.status.replace('_', ' ')}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/admin/blog')}>
            Back to list
          </Button>
          {initial && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={`/admin/blog/${initial.id}/preview`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4" /> Preview
              </a>
            </Button>
          )}
          <Button type="submit" size="sm" disabled={mutation.isPending} className="gap-1.5">
            <Save className="h-4 w-4" />
            {mutation.isPending ? 'Saving…' : mode === 'create' ? 'Create draft' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Article title…"
          value={watchTitle}
          onChange={(e) => {
            form.setValue('title', e.target.value);
            if (!slugManual) setSlugValue(slugify(e.target.value));
            if (!metaTitleManual) setMetaTitleValue(e.target.value);
          }}
        />
        {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Slug</Label>
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => setSlugManual((v) => !v)}>
            {slugManual ? 'Auto-generate' : 'Edit manually'}
          </button>
        </div>
        <Input
          value={slugValue}
          disabled={!slugManual}
          onChange={(e) => setSlugValue(e.target.value)}
          placeholder="auto-generated-from-title"
          className={cn(!slugManual && 'opacity-60')}
        />
      </div>

      <div className="space-y-2">
        <Label>Summary</Label>
        <Controller
          control={form.control}
          name="summary"
          render={({ field }) => (
            <Textarea
              {...field}
              rows={3}
              placeholder="Short excerpt for listing cards…"
              onChange={(e) => {
                field.onChange(e);
                if (!metaDescManual) setMetaDescValue(e.target.value);
              }}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Article type</Label>
        <Controller
          control={form.control}
          name="articleType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARTICLE_TYPE_VALUES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ARTICLE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Curriculum tag (optional)</Label>
        <p className="text-xs text-muted-foreground">
          Ties this article to a subject/chapter/topic — powers the &quot;Concept Check&quot; question and suggested
          articles shown on the public page.
        </p>
        {selectedNode ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 py-1">
              {selectedNode.name}
              <span className="text-[10px] uppercase text-muted-foreground">{selectedNode.nodeType}</span>
              <button type="button" onClick={() => setNodeId(undefined)} aria-label="Remove tag">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        ) : (
          <div className="relative">
            <Input
              value={nodeSearch}
              onChange={(e) => setNodeSearch(e.target.value)}
              placeholder="Search subjects, chapters, topics…"
            />
            {filteredNodes.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                {filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setNodeId(node.id);
                      setNodeSearch('');
                    }}
                  >
                    <span>{node.name}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{node.nodeType}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_STATUS_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Controller
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_VISIBILITY_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-md border border-border p-4">
        <p className="text-sm font-medium text-foreground">SEO</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Meta title</Label>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setMetaTitleManual((v) => !v)}
            >
              {metaTitleManual ? 'Auto-generate' : 'Edit manually'}
            </button>
          </div>
          <Input
            value={metaTitleValue}
            disabled={!metaTitleManual}
            onChange={(e) => setMetaTitleValue(e.target.value)}
            placeholder="Defaults to the article title"
            maxLength={160}
            className={cn(!metaTitleManual && 'opacity-60')}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Meta description</Label>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setMetaDescManual((v) => !v)}
            >
              {metaDescManual ? 'Auto-generate' : 'Edit manually'}
            </button>
          </div>
          <Textarea
            value={metaDescValue}
            disabled={!metaDescManual}
            onChange={(e) => setMetaDescValue(e.target.value)}
            rows={2}
            placeholder="Defaults to the summary"
            maxLength={320}
            className={cn(!metaDescManual && 'opacity-60')}
          />
        </div>

        <div className="space-y-2">
          <Label>Keywords</Label>
          <Input
            value={keywordsValue}
            onChange={(e) => setKeywordsValue(e.target.value)}
            placeholder="comma, separated, keywords"
          />
        </div>

        <div className="space-y-2">
          <Label>OG image URL</Label>
          <Controller
            control={form.control}
            name="ogImage"
            render={({ field }) => <Input {...field} placeholder="https://…" />}
          />
          {form.formState.errors.ogImage && (
            <p className="text-xs text-destructive">{form.formState.errors.ogImage.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Content</Label>
          <div className="flex gap-1 rounded-md border border-border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={editorView === 'rich' ? 'secondary' : 'ghost'}
              className="h-7 px-2.5 text-xs"
              onClick={() => setEditorView('rich')}
            >
              Rich text
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editorView === 'markdown' ? 'secondary' : 'ghost'}
              className="h-7 px-2.5 text-xs"
              onClick={() => setEditorView('markdown')}
            >
              Markdown
            </Button>
          </div>
        </div>
        <Controller
          control={form.control}
          name="body"
          render={({ field }) =>
            editorView === 'markdown' ? (
              <Textarea
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="Paste or write raw Markdown…"
                className="min-h-[420px] font-mono text-sm"
              />
            ) : (
              <BlogEditor value={field.value} onChange={field.onChange} placeholder="Start writing…" className="min-h-[420px]" />
            )
          }
        />
        {editorView === 'markdown' && (
          <p className="text-xs text-muted-foreground">
            Editing raw Markdown directly — switch back to Rich text to see it rendered and keep editing visually.
          </p>
        )}
      </div>
    </form>
  );
}
