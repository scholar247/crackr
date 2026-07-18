import { randomUUID } from 'crypto';
import { contentSeedRepository } from '@/server/repositories/ai-seed.repository';
import { blogRepository } from '@/server/repositories/blog.repository';
import { topicRepository } from '@/server/repositories/topic.repository';
import { examRepository } from '@/server/repositories/exam.repository';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { getAIProvider } from '../providers';
import {
  buildBlogMetadataPrompt,
  BLOG_METADATA_PROMPT_VERSION,
  type BlogMetadataResult,
} from '../prompts/blog-metadata.prompt';
import { parseJsonResponse } from '../json-utils';
import { validateBlogMetadata } from '../validation/blog-validation';
import { aiLogger } from '../logger';
import { slugify } from '@/lib/utils';
import type { ContentSeedClient, BlogType } from '@/types';

const ARTICLE_TYPE_LABELS: Record<BlogType, string> = {
  THEORY: 'Theory',
  QUICK_LEARN: 'Quick Learn',
  SHORT_NOTE: 'Short Note',
  FORMULA_SHEET: 'Formula Sheet',
  REVISION_NOTE: 'Revision Note',
  FAQ: 'FAQ',
  TRICKS: 'Tricks',
  CHEAT_SHEET: 'Cheat Sheet',
};

export interface JobBatchResult {
  processed: number;
  succeeded: number;
  failed: number;
}

async function processSeed(seed: ContentSeedClient, runId: string): Promise<boolean> {
  const ctx = {
    runId,
    phase: 'BLOG_SEED' as const,
    seedId: seed.id,
    examId: seed.examId,
    subjectId: seed.subjectId,
    topicId: seed.topicId,
  };
  const start = Date.now();

  try {
    const [topic, exam, subject] = await Promise.all([
      topicRepository.findById(seed.topicId),
      examRepository.findById(seed.examId),
      subjectRepository.findById(seed.subjectId),
    ]);
    if (!topic) throw new Error('Topic not found');

    const articleType: BlogType = seed.articleType ?? 'THEORY';
    const provider = getAIProvider();

    const prompt = buildBlogMetadataPrompt({
      topic: topic.name,
      examName: exam?.name ?? '',
      subjectName: subject?.name ?? '',
      articleTypeLabel: ARTICLE_TYPE_LABELS[articleType] ?? articleType,
      angleHint: seed.angleHint,
    });

    const raw = await provider.generateText(prompt, { temperature: 0.4, maxOutputTokens: 1024 });
    let metadata: BlogMetadataResult;
    try {
      metadata = parseJsonResponse<BlogMetadataResult>(raw);
    } catch (parseError) {
      throw new Error(
        `Could not parse metadata JSON (${parseError instanceof Error ? parseError.message : parseError}). Raw response: ${raw.slice(0, 500)}`
      );
    }

    const slug = metadata.slug ? slugify(metadata.slug) : slugify(metadata.title);
    const validation = await validateBlogMetadata({
      slug,
      title: metadata.title,
      topicId: seed.topicId,
      articleType,
    });
    if (!validation.valid) throw new Error(`Validation failed: ${validation.errors.join('; ')}`);

    const blog = await blogRepository.create(
      {
        type: articleType,
        title: metadata.title,
        slug,
        summary: metadata.summary || metadata.metaDescription || '',
        content: '',
        examIds: [seed.examId],
        subjectIds: [seed.subjectId],
        topicIds: [seed.topicId],
        relatedBlogIds: [],
        tagIds: [],
        seo: {
          metaTitle: metadata.seoTitle,
          metaDescription: metadata.metaDescription,
          keywords: metadata.keywords ?? [],
        },
        status: 'SEEDING',
        aiMeta: {
          seedId: seed.id,
          provider: provider.name,
          model: provider.model,
          promptVersion: BLOG_METADATA_PROMPT_VERSION,
          generatedAt: new Date().toISOString(),
        },
      },
      seed.createdBy,
      seed.creatorEmail
    );

    await contentSeedRepository.markDone(seed.id, { resultBlogId: blog.id });
    aiLogger.info(ctx, `Seeded blog stub "${metadata.title}"`, {
      durationMs: Date.now() - start,
      provider: provider.name,
      model: provider.model,
      blogId: blog.id,
    });
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await contentSeedRepository.markFailed(seed.id, message);
    aiLogger.error(ctx, `Blog seeding failed: ${message}`, { durationMs: Date.now() - start });
    return false;
  }
}

export async function runBlogSeederBatch(limit = 10): Promise<JobBatchResult> {
  const runId = randomUUID();
  let processed = 0;
  let succeeded = 0;

  for (let i = 0; i < limit; i++) {
    const seed = await contentSeedRepository.claimNext({ kind: 'BLOG' });
    if (!seed) break;
    processed++;
    if (await processSeed(seed, runId)) succeeded++;
  }

  if (processed === 0) {
    console.log('[ai-factory:BLOG_SEED] No PENDING blog seeds to process — batch was a no-op.');
  }

  return { processed, succeeded, failed: processed - succeeded };
}
