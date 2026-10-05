import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { articleRepository } from '@/server/repositories/article.repository';
import { blogsPath, childrenLabel, resolveBlogBrowse } from '@/server/services/blog-browse';
import { BlogBrowseView } from '@/components/blog/browse/blog-browse-view';

export const dynamic = 'force-dynamic';

type RouteParams = { examSlug: string; path?: string[] };

// /blogs/exams/[exam]                                  → blogs for the exam, subjects on the left
// /blogs/exams/[exam]/subject/[subject]                → that subject's blogs, its chapters on the left
// /blogs/exams/[exam]/subject/[s]/chapter/[c]/topic/[t] → and so on down the syllabus tree
export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { examSlug, path = [] } = await params;
  const resolved = await resolveBlogBrowse(examSlug, path);
  if (!resolved) return {};
  const label = resolved.current ? `${resolved.current.name} — ${resolved.exam.name}` : resolved.exam.name;
  return { title: `${label} blogs`, description: `Articles and guides for ${label}.` };
}

export default async function BlogsByExamPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { examSlug, path = [] } = await params;
  const sp = await searchParams;

  const resolved = await resolveBlogBrowse(examSlug, path);
  if (!resolved) notFound();
  const { exam, trail, current, children } = resolved;

  const nodeCounts = await articleRepository.countPublishedByNode();
  const basePath = blogsPath(exam.slug, trail);
  const parentTrail = trail.slice(0, -1);

  const breadcrumbs = [
    { label: 'Blog', href: '/blogs' },
    { label: exam.name, href: current ? blogsPath(exam.slug) : undefined },
    ...trail.map((n, i) => ({ label: n.name, href: i < trail.length - 1 ? blogsPath(exam.slug, trail.slice(0, i + 1)) : undefined })),
  ];

  // One level up: the previous node, or the exam itself, or the full list for the exam page.
  const back = current
    ? { label: parentTrail.length ? `Back to ${parentTrail[parentTrail.length - 1].name}` : `Back to ${exam.name}`, href: blogsPath(exam.slug, parentTrail) }
    : { label: 'All exams', href: '/blogs' };

  return (
    <BlogBrowseView
      breadcrumbs={breadcrumbs}
      title={current ? current.name : exam.name}
      description={current ? `Articles on ${current.name} for ${exam.name}.` : `Articles and guides for ${exam.name}.`}
      scope={current ? { nodeId: current.id } : { examId: exam.id }}
      basePath={basePath}
      searchParams={sp}
      sidebar={{
        title: children.length ? childrenLabel(children) : 'Sections',
        items: children.map((n) => ({ label: n.name, href: blogsPath(exam.slug, [...trail, n]), count: nodeCounts.get(n.id) ?? 0 })),
        back,
        emptyText: 'This is the most specific level — no further sections.',
      }}
      emptyText={`No articles for ${current ? current.name : exam.name} yet — check back soon.`}
    />
  );
}
