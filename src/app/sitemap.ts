import type { MetadataRoute } from 'next';
import { articleRepository } from '@/server/repositories/article.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { SITE_URL as BASE_URL } from '@/lib/site-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, exams] = await Promise.all([
    articleRepository.findPublished(),
    taxonomyRepository.listPublicExams(),
  ]);

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/blogs/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const examEntries: MetadataRoute.Sitemap = exams.map(({ exam }) => ({
    url: `${BASE_URL}/exams/${exam.slug}`,
    lastModified: exam.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
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
    ...articleEntries,
  ];
}
