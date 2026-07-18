import { randomUUID } from 'crypto';
import { contentSeedRepository } from '@/server/repositories/ai-seed.repository';
import { mcqService } from '@/server/services/mcq.service';
import { topicRepository } from '@/server/repositories/topic.repository';
import { examRepository } from '@/server/repositories/exam.repository';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { getAIProvider } from '../providers';
import {
  buildMCQGenerationPrompt,
  MCQ_GENERATION_PROMPT_VERSION,
  type MCQGenerationResultItem,
} from '../prompts/mcq-generation.prompt';
import { parseJsonResponse } from '../json-utils';
import { validateMCQItem } from '../validation/mcq-validation';
import { aiLogger } from '../logger';
import type { ContentSeedClient, Difficulty } from '@/types';
import type { JobBatchResult } from './blog-seeder.job';

async function processSeed(seed: ContentSeedClient, runId: string): Promise<boolean> {
  const topicId = seed.resolvedTopicId ?? seed.topicId;
  const ctx = {
    runId,
    phase: 'MCQ_GENERATE' as const,
    seedId: seed.id,
    examId: seed.examId,
    subjectId: seed.subjectId,
    topicId,
  };
  const start = Date.now();

  try {
    const [topic, exam, subject] = await Promise.all([
      topicRepository.findById(topicId),
      examRepository.findById(seed.examId),
      subjectRepository.findById(seed.subjectId),
    ]);
    if (!topic) throw new Error('Resolved topic not found');

    const provider = getAIProvider();
    const count = seed.targetCount ?? 10;
    const prompt = buildMCQGenerationPrompt({
      topic: topic.name,
      examName: exam?.name ?? '',
      subjectName: subject?.name ?? '',
      count,
      difficultyMix: seed.difficultyMix ?? { MEDIUM: 1 },
      includePYQ: seed.includePYQ ?? false,
    });

    const raw = await provider.generateText(prompt, { temperature: 0.7, maxOutputTokens: 8192 });
    let items: MCQGenerationResultItem[];
    try {
      items = parseJsonResponse<MCQGenerationResultItem[]>(raw);
    } catch (parseError) {
      throw new Error(
        `Could not parse MCQ JSON (${parseError instanceof Error ? parseError.message : parseError}). Raw response: ${raw.slice(0, 500)}`
      );
    }

    const resultMcqIds: string[] = [];
    let rejected = 0;

    for (const item of items) {
      const validation = await validateMCQItem(item, seed.subjectId);
      if (!validation.valid) {
        rejected++;
        aiLogger.warn(ctx, `Rejected generated MCQ: ${validation.errors.join('; ')}`, {
          question: item.question?.slice(0, 100),
        });
        continue;
      }

      const mcq = await mcqService.create(
        {
          subjectId: seed.subjectId,
          topicId,
          examIds: [seed.examId],
          examSectionIds: [],
          questionType: 'SINGLE',
          difficulty: (item.difficulty as Difficulty) ?? 'MEDIUM',
          question: [{ type: 'TEXT', content: item.question }],
          options: item.options.map((opt, i) => ({
            id: randomUUID(),
            content: [{ type: 'TEXT', content: opt }],
            isCorrect: i === item.correctIndex,
          })),
          explanation: [{ type: 'TEXT', content: item.explanation }],
          tagIds: [],
          isPreviousYear: seed.includePYQ ?? false,
          status: 'DRAFT',
          aiMeta: {
            seedId: seed.id,
            provider: provider.name,
            model: provider.model,
            promptVersion: MCQ_GENERATION_PROMPT_VERSION,
            generatedAt: new Date().toISOString(),
          },
        },
        seed.createdBy,
        seed.creatorEmail
      );
      resultMcqIds.push(mcq.id);
    }

    if (resultMcqIds.length === 0) {
      throw new Error(`All ${items.length} generated MCQs failed validation`);
    }

    await contentSeedRepository.markDone(seed.id, { resultMcqIds });
    aiLogger.info(ctx, `Generated ${resultMcqIds.length}/${items.length} MCQ(s) (${rejected} rejected)`, {
      durationMs: Date.now() - start,
      provider: provider.name,
      model: provider.model,
    });
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await contentSeedRepository.markFailed(seed.id, message);
    aiLogger.error(ctx, `MCQ generation failed: ${message}`, { durationMs: Date.now() - start });
    return false;
  }
}

export async function runMCQGeneratorBatch(limit = 10): Promise<JobBatchResult> {
  const runId = randomUUID();
  let processed = 0;
  let succeeded = 0;

  for (let i = 0; i < limit; i++) {
    const seed = await contentSeedRepository.claimNext({ kind: 'MCQ', resolvedTopicId: { $exists: true } });
    if (!seed) break;
    processed++;
    if (await processSeed(seed, runId)) succeeded++;
  }

  if (processed === 0) {
    console.log('[ai-factory:MCQ_GENERATE] No scoped PENDING MCQ seeds to process — batch was a no-op.');
  }

  return { processed, succeeded, failed: processed - succeeded };
}
