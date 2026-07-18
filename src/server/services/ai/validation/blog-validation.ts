import { blogRepository } from '@/server/repositories/blog.repository';
import type { BlogType } from '@/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Shorter formats (Cheat Sheet, Short Note) need less content than Theory to be considered complete. */
const MIN_WORD_COUNT: Record<BlogType, number> = {
  THEORY: 900,
  QUICK_LEARN: 250,
  SHORT_NOTE: 200,
  FORMULA_SHEET: 250,
  REVISION_NOTE: 300,
  FAQ: 350,
  TRICKS: 300,
  CHEAT_SHEET: 250,
};

/** Run before creating the SEEDING stub — catches duplicate slugs/titles before any full-content generation happens. */
export async function validateBlogMetadata(opts: {
  slug: string;
  title: string;
  topicId: string;
  articleType: BlogType;
}): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (await blogRepository.isSlugTaken(opts.slug)) {
    errors.push(`Slug "${opts.slug}" is already in use`);
  }

  const existing = await blogRepository.list({
    page: 1,
    pageSize: 5,
    topicIds: opts.topicId,
    type: opts.articleType,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  const dupTitle = existing.items.find(
    (b) => b.title.trim().toLowerCase() === opts.title.trim().toLowerCase()
  );
  if (dupTitle) {
    errors.push(`An article titled "${opts.title}" already exists for this topic/type (id=${dupTitle.id})`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Run on the full generated draft before flipping the Blog to DRAFT. */
export function validateBlogContent(markdown: string, articleType: BlogType): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  const minWords = MIN_WORD_COUNT[articleType] ?? 500;
  if (words < minWords) {
    errors.push(`Word count ${words} is below the minimum ${minWords} required for ${articleType}`);
  }

  const headingLines = markdown.split('\n').filter((l) => /^#{1,6}\s/.test(l));
  const h1Count = headingLines.filter((l) => /^#\s/.test(l)).length;
  if (h1Count !== 1) errors.push(`Expected exactly one H1 heading, found ${h1Count}`);

  const h2Count = headingLines.filter((l) => /^##\s/.test(l)).length;
  if (h2Count === 0) errors.push('Expected at least one H2 heading');

  let prevLevel = 0;
  for (const line of headingLines) {
    const level = line.match(/^(#{1,6})\s/)?.[1].length ?? 0;
    if (prevLevel > 0 && level > prevLevel + 1) {
      warnings.push(`Heading level skip detected (H${prevLevel} -> H${level})`);
      break;
    }
    prevLevel = level;
  }

  return { valid: errors.length === 0, errors, warnings };
}
