import { requireAuth } from '@/server/auth/require-auth';
import { questionRepository } from '@/server/repositories/question.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { BulkCreateQuestionSchema } from '@/schemas/question.schema';
import { apiError, apiSuccess } from '@/lib/utils';

export async function POST(req: Request) {
  const { session, error, isServiceKey } = await requireAuth('TEACHER');
  if (error) return error;

  const parsed = BulkCreateQuestionSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  // Never trust client-supplied uuids — same defensive re-validation as the blog bulk
  // route, checked once against the full active sets rather than per-item queries.
  const [validExamIds, validNodeIds] = await Promise.all([
    taxonomyRepository.listExams().then((rows) => new Set(rows.map((r) => r.exam.id))),
    taxonomyRepository.listNodes().then((rows) => new Set(rows.map((n) => n.id))),
  ]);

  for (const item of parsed.data) {
    if (item.examIds.some((id) => !validExamIds.has(id))) {
      return apiError(`Invalid exam id in item "${item.stem.slice(0, 40)}…"`, 400);
    }
    if (item.nodeIds?.some((id) => !validNodeIds.has(id))) {
      return apiError(`Invalid node id in item "${item.stem.slice(0, 40)}…"`, 400);
    }
  }

  const authorId = isServiceKey ? null : session!.user.id;
  const created = await questionRepository.bulkCreate(parsed.data, authorId);
  return apiSuccess(created, undefined, 201);
}
