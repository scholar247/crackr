import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BlogClient } from '@/types';
import { Clock, Eye, Calendar } from 'lucide-react';
import { blogService } from '@/server/services/blog.service';
import { examRepository } from '@/server/repositories/exam.repository';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { BlogsFilter } from './blogs-filter';

export const metadata: Metadata = {
  title: 'Blogs — Scholar247',
  description: 'Explore theory articles, quick-learn notes, and study guides for competitive exams.',
  alternates: { canonical: '/blogs' },
};

const TYPE_LABELS: Record<string, string> = {
  THEORY: 'Theory',
  QUICK_LEARN: 'Quick Learn',
};

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{
    page?: string;
    type?: string;
    examId?: string;
    subjectId?: string;
    topicId?: string;
  }>;
}

export default async function BlogsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const type = sp.type as 'THEORY' | 'QUICK_LEARN' | undefined;
  const examId = sp.examId ?? '';
  const subjectId = sp.subjectId ?? '';
  const topicId = sp.topicId ?? '';

  const [result, exams, subjects] = await Promise.all([
    blogService.listPublished({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'publishedAt',
      sortDir: 'desc',
      ...(type ? { type } : {}),
      ...(examId ? { examIds: examId } : {}),
      ...(subjectId ? { subjectIds: subjectId } : {}),
      ...(topicId ? { topicIds: topicId } : {}),
    }),
    examRepository.findAll(true),
    subjectRepository.findAll(true),
  ]);

  const blogs = result.items;
  const { totalPages } = result;

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const merged: Record<string, string | number> = {
      page,
      ...(type ? { type } : {}),
      ...(examId ? { examId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(topicId ? { topicId } : {}),
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => { if (v !== '' && v !== 0 || k === 'page') params.set(k, String(v)); });
    return `/blogs?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Blogs</h1>
        <p className="text-muted-foreground">Theory articles, quick-learn notes and study guides</p>
      </div>

      {/* Filters row */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Type pills */}
        <div className="flex gap-2 shrink-0">
          <Button variant={!type ? 'default' : 'outline'} size="sm" asChild>
            <Link href={buildHref({ page: 1, type: '' })}>All</Link>
          </Button>
          <Button variant={type === 'THEORY' ? 'default' : 'outline'} size="sm" asChild>
            <Link href={buildHref({ page: 1, type: 'THEORY' })}>Theory</Link>
          </Button>
          <Button variant={type === 'QUICK_LEARN' ? 'default' : 'outline'} size="sm" asChild>
            <Link href={buildHref({ page: 1, type: 'QUICK_LEARN' })}>Quick Learn</Link>
          </Button>
        </div>

        <div className="w-px h-6 bg-border shrink-0 hidden sm:block" />

        {/* Exam / Subject / Topic selects (client) */}
        <Suspense>
          <BlogsFilter
            exams={exams}
            subjects={subjects}
            examId={examId}
            subjectId={subjectId}
            topicId={topicId}
          />
        </Suspense>
      </div>

      {/* Active filter chips */}
      {(examId || subjectId || topicId) && (
        <div className="mb-5 flex flex-wrap gap-2 text-sm">
          {examId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5">
              {exams.find((e) => e.id === examId)?.name ?? examId}
              <Link href={buildHref({ page: 1, examId: '', subjectId: '', topicId: '' })} className="ml-1 hover:opacity-70">×</Link>
            </span>
          )}
          {subjectId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5">
              {subjects.find((s) => s.id === subjectId)?.name ?? subjectId}
              <Link href={buildHref({ page: 1, subjectId: '', topicId: '' })} className="ml-1 hover:opacity-70">×</Link>
            </span>
          )}
          {topicId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5">
              Topic filter active
              <Link href={buildHref({ page: 1, topicId: '' })} className="ml-1 hover:opacity-70">×</Link>
            </span>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {result.total === 0
          ? 'No blogs found'
          : `${result.total} blog${result.total !== 1 ? 's' : ''} · page ${page} of ${totalPages}`}
      </p>

      {/* Blog grid */}
      {blogs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-muted-foreground">No blogs match the selected filters.</p>
          <Button variant="ghost" size="sm" className="mt-3" asChild>
            <Link href="/blogs">Clear filters</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog: BlogClient) => (
            <Link
              key={blog.id}
              href={`/blogs/${blog.slug}`}
              className="group rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all overflow-hidden flex flex-col"
            >
              {blog.thumbnail && (
                <div className="aspect-video overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blog.thumbnail}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="flex-1 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[blog.type] ?? blog.type}
                  </Badge>
                </div>
                <h2 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {blog.title}
                </h2>
                {blog.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{blog.summary}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {blog.readingTimeMinutes}m read
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {blog.viewCount.toLocaleString()}
                  </span>
                  {blog.publishedAt && (
                    <span className="flex items-center gap-1 ml-auto">
                      <Calendar className="h-3 w-3" />
                      {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex flex-wrap justify-center items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? (
              <Link href={buildHref({ page: page - 1 })}>← Previous</Link>
            ) : (
              <span>← Previous</span>
            )}
          </Button>

          {/* Page number buttons — show up to 7 around current */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">…</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  asChild={p !== page}
                  disabled={p === page}
                >
                  {p !== page ? <Link href={buildHref({ page: p })}>{p}</Link> : <span>{p}</span>}
                </Button>
              )
            )}

          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
            {page < totalPages ? (
              <Link href={buildHref({ page: page + 1 })}>Next →</Link>
            ) : (
              <span>Next →</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
