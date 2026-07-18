import { randomUUID } from 'crypto';
import { blogRepository } from '@/server/repositories/blog.repository';
import { mcqRepository } from '@/server/repositories/mcq.repository';
import { contentSeedRepository } from '@/server/repositories/ai-seed.repository';
import { topicRepository } from '@/server/repositories/topic.repository';
import { aiLogger } from './logger';
import type { PlanSeedsInput } from '@/schemas/ai-seed.schema';

export interface PlanSeedsResult {
  planRunId: string;
  topicsScanned: number;
  seedsCreated: number;
  seedsSkipped: number;
  breakdown: Array<{
    topicId: string;
    topicName: string;
    blogSeedsCreated: number;
    mcqSeedsCreated: number;
    skipped: string[];
  }>;
}

/**
 * Inspects existing content per topic and creates only the PENDING seeds needed to reach the
 * configured min (capped at max), skipping topics/types already covered. Never calls AI — this
 * is the "Create Seeds" action, purely a read-existing-content + write-seeds operation.
 */
export async function planSeeds(
  input: PlanSeedsInput,
  createdBy: string,
  creatorEmail: string
): Promise<PlanSeedsResult> {
  const planRunId = randomUUID();
  let seedsCreated = 0;
  let seedsSkipped = 0;
  const breakdown: PlanSeedsResult['breakdown'] = [];

  for (const topicId of input.topicIds) {
    const topic = await topicRepository.findById(topicId);
    const topicName = topic?.name ?? topicId;
    const rowSkipped: string[] = [];
    let blogSeedsCreated = 0;
    let mcqSeedsCreated = 0;

    // ─── Blogs: one min/max target per requested article type ─────────────────
    for (const articleType of input.articleTypes) {
      const existing = await blogRepository.list({
        page: 1,
        pageSize: 1,
        topicIds: topicId,
        type: articleType,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      const existingCount = existing.total;

      if (existingCount >= input.minBlogSeeds) {
        rowSkipped.push(`BLOG/${articleType}: already has ${existingCount}/${input.minBlogSeeds}`);
        seedsSkipped++;
        await aiLogger.info(
          { runId: planRunId, phase: 'PLAN', topicId, examId: input.examId, subjectId: input.subjectId },
          `Skipped BLOG/${articleType} — already has ${existingCount} (min ${input.minBlogSeeds})`,
          { existingCount }
        );
        continue;
      }

      if (await contentSeedRepository.hasActiveSeed({ topicId, kind: 'BLOG', articleType })) {
        rowSkipped.push(`BLOG/${articleType}: seed already pending`);
        seedsSkipped++;
        continue;
      }

      const toCreate = Math.max(
        0,
        Math.min(input.minBlogSeeds - existingCount, input.maxBlogSeeds - existingCount)
      );
      for (let i = 0; i < toCreate; i++) {
        await contentSeedRepository.create({
          kind: 'BLOG',
          examId: input.examId,
          subjectId: input.subjectId,
          topicId,
          articleType,
          planRunId,
          createdBy,
          creatorEmail,
        });
        blogSeedsCreated++;
        seedsCreated++;
      }
      if (toCreate > 0) {
        await aiLogger.info(
          { runId: planRunId, phase: 'PLAN', topicId, examId: input.examId, subjectId: input.subjectId },
          `Created ${toCreate} BLOG/${articleType} seed(s)`,
          { existingCount, toCreate }
        );
      }
    }

    // ─── MCQs: existing count / mcqsPerSet ≈ existing "sets" ───────────────────
    const existingMcqCount = await mcqRepository.countMCQs({ topicId });
    const existingSets = Math.floor(existingMcqCount / input.mcqsPerSet);

    if (existingSets >= input.minMcqSets) {
      rowSkipped.push(`MCQ: already has ~${existingSets} set(s)/${input.minMcqSets}`);
      seedsSkipped++;
      await aiLogger.info(
        { runId: planRunId, phase: 'PLAN', topicId, examId: input.examId, subjectId: input.subjectId },
        `Skipped MCQ — already has ~${existingSets} set(s) (min ${input.minMcqSets})`,
        { existingMcqCount, existingSets }
      );
    } else if (await contentSeedRepository.hasActiveSeed({ topicId, kind: 'MCQ' })) {
      rowSkipped.push('MCQ: seed already pending');
      seedsSkipped++;
    } else {
      const setsToCreate = Math.max(
        0,
        Math.min(input.minMcqSets - existingSets, input.maxMcqSets - existingSets)
      );
      for (let i = 0; i < setsToCreate; i++) {
        await contentSeedRepository.create({
          kind: 'MCQ',
          examId: input.examId,
          subjectId: input.subjectId,
          topicId,
          targetCount: input.mcqsPerSet,
          difficultyMix: input.difficultyMix,
          includePYQ: input.includePYQ,
          autoCreateSubtopics: input.autoCreateSubtopics,
          planRunId,
          createdBy,
          creatorEmail,
        });
        mcqSeedsCreated++;
        seedsCreated++;
      }
      if (setsToCreate > 0) {
        await aiLogger.info(
          { runId: planRunId, phase: 'PLAN', topicId, examId: input.examId, subjectId: input.subjectId },
          `Created ${setsToCreate} MCQ seed(s)`,
          { existingMcqCount, existingSets, setsToCreate }
        );
      }
    }

    breakdown.push({ topicId, topicName, blogSeedsCreated, mcqSeedsCreated, skipped: rowSkipped });
  }

  await aiLogger.info(
    { runId: planRunId, phase: 'PLAN', examId: input.examId, subjectId: input.subjectId },
    `Plan run complete — ${seedsCreated} seed(s) created, ${seedsSkipped} skipped across ${input.topicIds.length} topic(s)`,
    { seedsCreated, seedsSkipped, topicsScanned: input.topicIds.length }
  );

  return {
    planRunId,
    topicsScanned: input.topicIds.length,
    seedsCreated,
    seedsSkipped,
    breakdown,
  };
}
