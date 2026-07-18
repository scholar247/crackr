import { randomUUID } from 'crypto';
import { marked } from 'marked';
import { blogRepository } from '@/server/repositories/blog.repository';
import { topicRepository } from '@/server/repositories/topic.repository';
import { examRepository } from '@/server/repositories/exam.repository';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { getAIProvider } from '../providers';
import { buildBlogContentPrompt, BLOG_CONTENT_PROMPT_VERSION } from '../prompts/blog-content.prompt';
import {
  buildBlogPolishPrompt,
  parseBlogPolishResponse,
  BLOG_POLISH_PROMPT_VERSION,
} from '../prompts/blog-polish.prompt';
import { validateBlogContent } from '../validation/blog-validation';
import { aiLogger } from '../logger';
import type { BlogClient } from '@/types';
import type { JobBatchResult } from './blog-seeder.job';

async function processBlog(blog: BlogClient, runId: string): Promise<boolean> {
  const topicId = blog.topicIds[0];
  const examId = blog.examIds[0];
  const subjectId = blog.subjectIds[0];
  const ctx = {
    runId,
    phase: 'BLOG_GENERATE' as const,
    seedId: blog.aiMeta?.seedId,
    examId,
    subjectId,
    topicId,
  };
  const start = Date.now();

  try {
    const [topic, exam, subject] = await Promise.all([
      topicId ? topicRepository.findById(topicId) : null,
      examId ? examRepository.findById(examId) : null,
      subjectId ? subjectRepository.findById(subjectId) : null,
    ]);

    const provider = getAIProvider();
    const primaryKeyword = blog.seo.keywords?.[0] ?? blog.title;

    const contentPrompt = buildBlogContentPrompt({
      title: blog.title,
      topic: topic?.name ?? blog.title,
      examName: exam?.name ?? '',
      subjectName: subject?.name ?? '',
      articleType: blog.type,
      primaryKeyword,
    });
    const draftMarkdown = await provider.generateText(contentPrompt, { temperature: 0.7, maxOutputTokens: 8192 });

    const polishPrompt = buildBlogPolishPrompt({
      topic: topic?.name ?? blog.title,
      primaryKeyword,
      draftMarkdown,
    });
    const polishRaw = await provider.generateText(polishPrompt, { temperature: 0.4, maxOutputTokens: 16384 });
    const { markdown: finalMarkdown, qaReport } = parseBlogPolishResponse(polishRaw, draftMarkdown);

    const validation = validateBlogContent(finalMarkdown, blog.type);
    if (!validation.valid) throw new Error(`Validation failed: ${validation.errors.join('; ')}`);

    const html = await marked.parse(finalMarkdown);

    await blogRepository.update(blog.id, {
      content: html,
      status: 'DRAFT',
      aiMeta: {
        seedId: blog.aiMeta?.seedId ?? '',
        provider: provider.name,
        model: provider.model,
        promptVersion: `${BLOG_CONTENT_PROMPT_VERSION}+${BLOG_POLISH_PROMPT_VERSION}`,
        generatedAt: new Date().toISOString(),
        qaReport: qaReport as Record<string, number | string[] | string>,
      },
    });

    aiLogger.info(ctx, `Generated full content for "${blog.title}"`, {
      durationMs: Date.now() - start,
      provider: provider.name,
      model: provider.model,
      validationWarnings: validation.warnings,
      qaReport,
    });
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await blogRepository.releaseSeedingLock(blog.id);
    aiLogger.error(ctx, `Blog content generation failed: ${message}`, { durationMs: Date.now() - start });
    return false;
  }
}

export async function runBlogGeneratorBatch(limit = 5): Promise<JobBatchResult> {
  const runId = randomUUID();
  let processed = 0;
  let succeeded = 0;

  for (let i = 0; i < limit; i++) {
    const blog = await blogRepository.claimNextSeeding();
    if (!blog) break;
    processed++;
    if (await processBlog(blog, runId)) succeeded++;
  }

  if (processed === 0) {
    console.log('[ai-factory:BLOG_GENERATE] No SEEDING blogs to process — batch was a no-op.');
  }

  return { processed, succeeded, failed: processed - succeeded };
}
