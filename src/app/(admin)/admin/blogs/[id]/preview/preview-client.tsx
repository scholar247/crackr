'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BlogClient } from '@/types';
import { Clock, Eye, Calendar, ArrowLeft, Pencil, AlertTriangle, RefreshCw } from 'lucide-react';
import { BlogContent } from '@/app/(browse)/blogs/[slug]/blog-content';

interface DraftCache {
  formData: Partial<Record<string, unknown>>;
  selectedExamIds?: string[];
  selectedSubjectIds?: string[];
  selectedTopicIds?: string[];
  selectedTagIds?: string[];
  savedAt: string;
}

interface Props {
  initialBlog: BlogClient;
  cacheKey: string;
}

const TYPE_LABELS: Record<string, string> = {
  THEORY: 'Theory',
  QUICK_LEARN: 'Quick Learn',
};

export function BlogPreviewClient({ initialBlog, cacheKey }: Props) {
  const [blog, setBlog] = useState<BlogClient>(initialBlog);
  const [fromCache, setFromCache] = useState(false);
  const [cacheAge, setCacheAge] = useState<string>('');

  const applyCache = () => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return false;
      const draft: DraftCache = JSON.parse(raw);
      setBlog((prev) => ({
        ...prev,
        title: (draft.formData.title as string) ?? prev.title,
        summary: (draft.formData.summary as string) ?? prev.summary,
        content: (draft.formData.content as string) ?? prev.content,
        status: (draft.formData.status as BlogClient['status']) ?? prev.status,
        type: (draft.formData.type as BlogClient['type']) ?? prev.type,
        featuredImage: (draft.formData.featuredImage as string | undefined) ?? prev.featuredImage,
        examIds: draft.selectedExamIds ?? prev.examIds,
        subjectIds: draft.selectedSubjectIds ?? prev.subjectIds,
        topicIds: draft.selectedTopicIds ?? prev.topicIds,
        tagIds: draft.selectedTagIds ?? prev.tagIds,
      }));
      const savedAt = new Date(draft.savedAt);
      const diffSec = Math.round((Date.now() - savedAt.getTime()) / 1000);
      if (diffSec < 60) setCacheAge(`${diffSec}s ago`);
      else if (diffSec < 3600) setCacheAge(`${Math.round(diffSec / 60)}m ago`);
      else setCacheAge(savedAt.toLocaleTimeString());
      setFromCache(true);
      return true;
    } catch {
      return false;
    }
  };

  const resetToSaved = () => {
    setBlog(initialBlog);
    setFromCache(false);
    setCacheAge('');
  };

  useEffect(() => {
    applyCache();
  // run on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Admin preview bar */}
      <div className="sticky top-0 z-50 border-b bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm text-amber-800 dark:text-amber-300 min-w-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-medium shrink-0">Preview</span>
            <Badge
              variant={blog.status === 'PUBLISHED' ? 'default' : 'secondary'}
              className="text-xs shrink-0"
            >
              {blog.status}
            </Badge>
            {fromCache ? (
              <span className="text-xs opacity-70 truncate">
                Showing unsaved edits ({cacheAge}) —{' '}
                <button onClick={resetToSaved} className="underline hover:no-underline">
                  show saved version
                </button>
              </span>
            ) : (
              <span className="text-xs opacity-70 truncate">Showing saved version</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={() => { applyCache() || window.location.reload(); }}
              title="Reload latest draft from cache"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button asChild size="sm" variant="ghost" className="gap-1.5">
              <Link href="/admin/blogs">
                <ArrowLeft className="h-3.5 w-3.5" />
                All blogs
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href={`/admin/blogs/${initialBlog.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Blog content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <Badge variant="outline" className="text-xs">
            {TYPE_LABELS[blog.type] ?? blog.type}
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight leading-tight">{blog.title}</h1>

          {blog.summary && (
            <p className="text-lg text-muted-foreground">{blog.summary}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {blog.readingTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {blog.viewCount.toLocaleString()} views
            </span>
            {blog.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {/* Featured image */}
        {blog.featuredImage && (
          <div className="mb-8 rounded-xl overflow-hidden aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={blog.featuredImage} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Body */}
        {blog.content ? (
          <BlogContent content={blog.content} />
        ) : (
          <p className="text-muted-foreground italic">No content yet.</p>
        )}
      </div>
    </div>
  );
}
