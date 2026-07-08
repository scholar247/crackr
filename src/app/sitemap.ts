import type { MetadataRoute } from 'next';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { examRepository } from '@/server/repositories/exam.repository';
import { pypRepository } from '@/server/repositories/pyp.repository';
import { blogRepository } from '@/server/repositories/blog.repository';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://scholar247.org';

// sitemap.ts is cached by default unless it opts into dynamic rendering —
// force it to re-run the DB queries on every request instead of serving a stale build-time snapshot.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [subjects, exams, pyps, publishedBlogs] = await Promise.all([
    subjectRepository.findAll(true),
    examRepository.findAll(true),
    pypRepository.findAll(true),
    blogRepository.findAllPublishedForSitemap(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE_URL}/exams`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/subjects`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/pyp`,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/courses`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/blogs`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/about`,         lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE_URL}/contact`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE_URL}/privacy-policy`,lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE_URL}/terms`,         lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
  ];

  const subjectRoutes: MetadataRoute.Sitemap = subjects.map((s) => ({
    url: `${BASE_URL}/subjects/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const examRoutes: MetadataRoute.Sitemap = exams.map((e) => ({
    url: `${BASE_URL}/exams/${e.slug}`,
    lastModified: new Date(e.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Group PYPs by exam slug for /pyp/[examSlug] pages
  const examSlugsInPyp = [...new Set(pyps.map((p) => p.examSlug))];
  const pypExamRoutes: MetadataRoute.Sitemap = examSlugsInPyp.map((examSlug) => ({
    url: `${BASE_URL}/pyp/${examSlug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const pypPaperRoutes: MetadataRoute.Sitemap = pyps.map((p) => ({
    url: `${BASE_URL}/pyp/${p.examSlug}/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = publishedBlogs.map((b) => ({
    url: `${BASE_URL}/blogs/${b.slug}`,
    lastModified: new Date(b.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [
    ...staticRoutes,
    ...subjectRoutes,
    ...examRoutes,
    ...pypExamRoutes,
    ...pypPaperRoutes,
    ...blogRoutes,
  ];
}
