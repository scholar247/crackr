import type { MetadataRoute } from 'next';
import { articleRepository } from '@/server/repositories/article.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { SITE_URL as BASE_URL } from '@/lib/site-config';
import { EXAM_LANDINGS } from '@/components/exam-landing/registry';
import { samplePaperRepository } from '@/server/repositories/sample-paper.repository';
import { samplePapersPath } from '@/lib/sample-papers';
import { notificationRepository } from '@/server/repositories/notification.repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, exams, samplePapers, notificationsUpdated] = await Promise.all([
    articleRepository.findPublished(),
    taxonomyRepository.listPublicExams(),
    samplePaperRepository.listPublishedForSitemap(),
    notificationRepository.latestPublishedAtByExam(),
  ]);

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/blogs/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // An exam home page changes whenever a notification on its board does, so date it by
  // whichever is newer.
  const examEntries: MetadataRoute.Sitemap = exams.map(({ exam }) => {
    const noticeUpdated = notificationsUpdated.get(exam.id);
    return {
      url: `${BASE_URL}/exams/${exam.slug}`,
      lastModified: noticeUpdated && noticeUpdated > exam.updatedAt ? noticeUpdated : exam.updatedAt,
      changeFrequency: noticeUpdated ? ('daily' as const) : ('weekly' as const),
      priority: 0.7,
    };
  });

  // Inner pages of exams with a purpose-built landing (e.g. /exams/nimcet/syllabus), only
  // for exams that are publicly listed.
  const listedSlugs = new Set(exams.map(({ exam }) => exam.slug));
  const examSubpageEntries: MetadataRoute.Sitemap = Object.entries(EXAM_LANDINGS).flatMap(([slug, landing]) =>
    listedSlugs.has(slug)
      ? (landing.sitemapPaths?.() ?? []).map((path) => ({
          url: `${BASE_URL}/exams/${slug}/${path}`,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      : [],
  );

  // Sample papers: hub + one page per session + one per paper, each dated by its newest
  // paper so Google recrawls when a new subject or session is published.
  const newest = new Map<string, Date>();
  const bump = (path: string, at: Date) => {
    const prev = newest.get(path);
    if (!prev || at > prev) newest.set(path, at);
  };
  for (const p of samplePapers) {
    bump(samplePapersPath(p.examSlug), p.updatedAt);
    bump(samplePapersPath(p.examSlug, p.year), p.updatedAt);
    bump(samplePapersPath(p.examSlug, p.year, p.subjectSlug), p.updatedAt);
  }
  const samplePaperEntries: MetadataRoute.Sitemap = [...newest].map(([path, lastModified]) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    // Hub pages rank for the head term ("CBSE Class 10 sample paper"); paper pages for the long tail.
    priority: path.split('/').length <= 4 ? 0.8 : path.split('/').length === 5 ? 0.7 : 0.6,
  }));

  return [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/exams`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/blogs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    ...examEntries,
    ...examSubpageEntries,
    ...samplePaperEntries,
    ...articleEntries,
  ];
}
