import { randomUUID } from 'crypto';
import { contentSeedRepository } from '@/server/repositories/ai-seed.repository';
import { topicRepository } from '@/server/repositories/topic.repository';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { getAIProvider } from '../providers';
import { buildSubtopicSuggestionPrompt } from '../prompts/subtopic-suggestion.prompt';
import { parseJsonResponse } from '../json-utils';
import { aiLogger } from '../logger';
import { slugify } from '@/lib/utils';
import type { ContentSeedClient } from '@/types';
import type { JobBatchResult } from './blog-seeder.job';

const SUBTOPIC_COUNT_DEFAULT = 4;

async function resolveSeedScope(seed: ContentSeedClient, runId: string): Promise<boolean> {
  const ctx = {
    runId,
    phase: 'MCQ_SEED' as const,
    seedId: seed.id,
    examId: seed.examId,
    subjectId: seed.subjectId,
    topicId: seed.topicId,
  };
  const start = Date.now();

  try {
    const topic = await topicRepository.findById(seed.topicId);
    if (!topic) throw new Error('Topic not found');

    const children = await topicRepository.getChildTopics(seed.topicId);
    if (children.length > 0 || !seed.autoCreateSubtopics || topic.depth >= 3) {
      // Already has subtopics, auto-create not requested, or already at max depth — generate directly at this topic.
      await contentSeedRepository.resolveScope(seed.id, seed.topicId);
      aiLogger.info(ctx, `Scope resolved to "${topic.name}" (no subtopic creation needed)`, {
        durationMs: Date.now() - start,
        childCount: children.length,
      });
      return true;
    }

    // Broad chapter-level topic with no children yet, and auto-create-subtopics was requested.
    const subject = await subjectRepository.findById(seed.subjectId);
    const provider = getAIProvider();
    const prompt = buildSubtopicSuggestionPrompt({
      topicName: topic.name,
      subjectName: subject?.name ?? '',
      count: SUBTOPIC_COUNT_DEFAULT,
    });
    const raw = await provider.generateText(prompt, { temperature: 0.5, maxOutputTokens: 512 });
    const names = parseJsonResponse<string[]>(raw).slice(0, SUBTOPIC_COUNT_DEFAULT);

    let resolvedTopicId: string | null = null;
    let created = 0;
    for (const name of names) {
      const existing = await topicRepository.findBySlugInSubject(slugify(name), seed.subjectId, seed.topicId);
      const child = existing ?? (await topicRepository.create({ name, subjectId: seed.subjectId, parentId: seed.topicId, order: created }));
      if (!existing) created++;
      if (!resolvedTopicId) resolvedTopicId = child.id;
    }

    if (!resolvedTopicId) throw new Error('AI returned no usable subtopic names');

    await contentSeedRepository.resolveScope(seed.id, resolvedTopicId);
    aiLogger.info(ctx, `Created ${created} subtopic(s) under "${topic.name}", scoped to first one`, {
      durationMs: Date.now() - start,
      subtopicsRequested: names.length,
      resolvedTopicId,
    });
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await contentSeedRepository.markFailed(seed.id, message);
    aiLogger.error(ctx, `MCQ scope resolution failed: ${message}`, { durationMs: Date.now() - start });
    return false;
  }
}

export async function runMCQSeederBatch(limit = 10): Promise<JobBatchResult> {
  const runId = randomUUID();
  let processed = 0;
  let succeeded = 0;

  for (let i = 0; i < limit; i++) {
    const seed = await contentSeedRepository.claimForScoping();
    if (!seed) break;
    processed++;
    if (await resolveSeedScope(seed, runId)) succeeded++;
  }

  if (processed === 0) {
    console.log('[ai-factory:MCQ_SEED] No unscoped PENDING MCQ seeds to process — batch was a no-op.');
  }

  return { processed, succeeded, failed: processed - succeeded };
}
