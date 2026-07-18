import { getMongoDb } from '@/lib/mongodb';
import { fromMongo } from '@/server/repositories/mongo/helpers';
import type { MCQGenerationResultItem } from '../prompts/mcq-generation.prompt';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Same exact-first-question-text dedup pattern already proven in src/app/api/seed/mcqs/route.ts. */
export async function findDuplicateMCQ(subjectId: string, questionText: string) {
  const db = await getMongoDb();
  const qt = questionText.trim().toLowerCase();
  if (!qt) return null;
  const doc = await db.collection('mcqs').findOne({
    subjectId,
    'question.0.content': { $regex: new RegExp(`^${escapeRegex(qt)}$`, 'i') },
  });
  return doc ? fromMongo(doc) : null;
}

export async function validateMCQItem(
  item: MCQGenerationResultItem,
  subjectId: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!item.question || item.question.trim().length < 10) {
    errors.push('Question text is missing or too short');
  }
  if (!Array.isArray(item.options) || item.options.length !== 4) {
    errors.push(`Expected exactly 4 options, got ${item.options?.length ?? 0}`);
  }
  if (typeof item.correctIndex !== 'number' || item.correctIndex < 0 || item.correctIndex > 3) {
    errors.push('correctIndex must be an integer between 0 and 3');
  }
  if (!item.explanation || item.explanation.trim().length < 15) {
    errors.push('Explanation is missing or too short');
  }

  if (errors.length === 0) {
    const dupe = await findDuplicateMCQ(subjectId, item.question);
    if (dupe) errors.push(`Duplicate question already exists (id=${(dupe as { id: string }).id})`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
