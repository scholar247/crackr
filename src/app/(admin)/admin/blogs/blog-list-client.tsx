'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Search, Globe, Archive, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import type { BlogClient, BlogStatus, ExamClient, SubjectClient } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_VARIANTS: Record<BlogStatus, 'secondary' | 'outline' | 'success' | 'destructive'> = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  ARCHIVED: 'destructive',
  SEEDING: 'outline',
};

const TYPE_LABELS: Record<string, string> = {
  THEORY: 'Theory',
  QUICK_LEARN: 'Quick Learn',
  SHORT_NOTE: 'Short Note',
  FORMULA_SHEET: 'Formula Sheet',
  REVISION_NOTE: 'Revision Note',
  FAQ: 'FAQ',
  TRICKS: 'Tricks',
  CHEAT_SHEET: 'Cheat Sheet',
};

async function fetchBlogs(params: URLSearchParams) {
  const res = await fetch(`/api/admin/blogs?${params}`);
  return res.json();
}

async function fetchExams() {
  const res = await fetch('/api/exams');
  return (await res.json()).data as ExamClient[];
}

async function fetchSubjects() {
  const res = await fetch('/api/subjects');
  return (await res.json()).data as SubjectClient[];
}

async function patchBlog(id: string, body: object) {
  const res = await fetch(`/api/admin/blogs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Request failed');
}

export function BlogListClient() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: '20',
    sortBy: 'createdAt',
    sortDir: 'desc',
    ...(search ? { search } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(examId ? { examIds: examId } : {}),
    ...(subjectId ? { subjectIds: subjectId } : {}),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blogs', params.toString()],
    queryFn: () => fetchBlogs(params),
  });

  const { data: exams } = useQuery({ queryKey: ['exams'], queryFn: fetchExams });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects });

  const blogs: BlogClient[] = data?.data ?? [];
  const meta = data?.meta ?? {};

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BlogStatus }) =>
      patchBlog(id, { status }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success(`Blog set to ${status.toLowerCase()}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error('Delete failed');
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog archived');
    },
    onError: () => toast.error('Failed to archive blog'),
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blogs…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); resetPage(); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="THEORY">Theory</SelectItem>
            <SelectItem value="QUICK_LEARN">Quick Learn</SelectItem>
            <SelectItem value="SHORT_NOTE">Short Note</SelectItem>
            <SelectItem value="FORMULA_SHEET">Formula Sheet</SelectItem>
            <SelectItem value="REVISION_NOTE">Revision Note</SelectItem>
            <SelectItem value="FAQ">FAQ</SelectItem>
            <SelectItem value="TRICKS">Tricks</SelectItem>
            <SelectItem value="CHEAT_SHEET">Cheat Sheet</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); resetPage(); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SEEDING">Seeding</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={examId} onValueChange={(v) => { setExamId(v === 'all' ? '' : v); resetPage(); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All exams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All exams</SelectItem>
            {exams?.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={subjectId} onValueChange={(v) => { setSubjectId(v === 'all' ? '' : v); resetPage(); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 w-[40%]">Title</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Read</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Views</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-12">
                    No blogs found
                  </td>
                </tr>
              ) : (
                blogs.map((blog, i) => (
                  <tr
                    key={blog.id}
                    className={cn(
                      'transition-colors',
                      i % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{blog.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{blog.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[blog.type] ?? blog.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[blog.status]} className="text-xs">
                        {blog.status.charAt(0) + blog.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {blog.readingTimeMinutes}m
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {blog.viewCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {blog.status !== 'PUBLISHED' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Publish"
                            onClick={() => statusMutation.mutate({ id: blog.id, status: 'PUBLISHED' })}
                            disabled={statusMutation.isPending}
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                        )}
                        {blog.status === 'PUBLISHED' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Unpublish (Draft)"
                            onClick={() => statusMutation.mutate({ id: blog.id, status: 'DRAFT' })}
                            disabled={statusMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {blog.status === 'PUBLISHED' && (
                          <Button variant="ghost" size="icon-sm" asChild title="Preview">
                            <Link href={`/blogs/${blog.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/admin/blogs/${blog.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
                              <Archive className="h-4 w-4" />
                              <span className="sr-only">Archive</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive blog?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark the blog as archived. It will no longer be publicly visible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(blog.id)}
                              >
                                Archive
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
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
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
