import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, AssessmentValidationError } from '@/server/repositories/assessment.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { CreateSelfMockSchema } from '@/schemas/self-mock.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// Any signed-in user can build a self-mock — no min role, same as practice.
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const parsed = CreateSelfMockSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const exam = await taxonomyRepository.findExamById(parsed.data.examId);
  if (!exam || exam.status !== 'ACTIVE') return apiError('Invalid exam', 400);

  // Never trust client-supplied node ids — same defensive re-validation as the question
  // bulk-create route.
  const nodeIds = parsed.data.sections.map((s) => s.nodeId).filter((id): id is string => Boolean(id));
  if (nodeIds.length > 0) {
    const validNodeIds = await taxonomyRepository.listNodes().then((rows) => new Set(rows.map((n) => n.id)));
    const invalid = nodeIds.find((id) => !validNodeIds.has(id));
    if (invalid) return apiError(`Invalid node id: ${invalid}`, 400);
  }

  try {
    const created = await assessmentRepository.createSelfMock({
      title: parsed.data.title,
      description: parsed.data.description,
      examId: parsed.data.examId,
      sections: parsed.data.sections,
      durationSeconds: parsed.data.durationMinutes * 60,
      maxAttempts: parsed.data.maxAttempts ?? null,
      creatorUserId: session!.user.id,
      studentInstructions: parsed.data.studentInstructions,
      tags: parsed.data.tags,
      bannerImage: parsed.data.bannerImage,
    });
    return apiSuccess(created, undefined, 201);
  } catch (err) {
    if (err instanceof AssessmentValidationError) {
      const detail = err.issues.map((i) => `"${i.section}": requested ${i.requested}, only ${i.available} published`).join('; ');
      return apiError(`${err.message} — ${detail}`, 400);
    }
    throw err;
  }
}
