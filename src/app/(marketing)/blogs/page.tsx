import type { Metadata } from 'next';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { articleRepository } from '@/server/repositories/article.repository';
import { blogsPath } from '@/server/services/blog-browse';
import { BlogBrowseView } from '@/components/blog/browse/blog-browse-view';

export const metadata: Metadata = { title: 'Blog' };
export const dynamic = 'force-dynamic';

export default async function BlogsPage({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string }> }) {
  const sp = await searchParams;
  const [examRows, examCounts] = await Promise.all([taxonomyRepository.listPublicExams(), articleRepository.countPublishedByExam()]);

  return (
    <BlogBrowseView
      title="Blog"
      description="Guides and explanations to go along with your exam prep."
      basePath="/blogs"
      searchParams={sp}
      sidebar={{
        title: 'Exams',
        items: examRows.map(({ exam }) => ({ label: exam.name, href: blogsPath(exam.slug), count: examCounts.get(exam.id) ?? 0 })),
        emptyText: 'No exams yet.',
      }}
      emptyText="No articles published yet — check back soon."
    />
  );
}
