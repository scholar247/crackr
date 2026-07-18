export const BLOG_METADATA_PROMPT_VERSION = 'v1';

export interface BlogMetadataParams {
  topic: string;
  examName: string;
  subjectName: string;
  articleTypeLabel: string;
  angleHint?: string;
}

export interface BlogMetadataResult {
  title: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  primaryKeyword: string;
  keywords: string[];
  summary: string;
}

/** Blog Seeder stage — title/slug/summary/SEO only, no article body. */
export function buildBlogMetadataPrompt(p: BlogMetadataParams): string {
  return `You are an SEO expert. Generate metadata for an educational blog article.

Topic: ${p.topic}
Exam: ${p.examName || 'General'}
Subject: ${p.subjectName || 'General'}
Article type: ${p.articleTypeLabel}
${p.angleHint ? `Specific angle: ${p.angleHint}\n` : ''}
Return ONLY a valid JSON object (no markdown, no explanation) with these exact fields:
{
  "title": "Full article title (60-80 chars)",
  "seoTitle": "SEO-optimized title (50-60 chars)",
  "metaDescription": "Compelling meta description (140-160 chars)",
  "slug": "url-friendly-slug-with-hyphens",
  "primaryKeyword": "main keyword phrase",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "summary": "1-2 sentence plain-text summary of the article"
}`;
}
