import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, AssessmentValidationError, ASSESSMENT_ERROR_STATUS } from '@/server/repositories/assessment.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { userRepository } from '@/server/repositories/user.repository';
import { CreateChallengeSchema } from '@/schemas/challenge.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// Any signed-in user can challenge another — same permissive creator model as self-mocks
// and group tests.
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const parsed = CreateChallengeSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  const input = parsed.data;

  const exam = await taxonomyRepository.findExamById(input.examId);
  if (!exam || exam.status !== 'ACTIVE') return apiError('Invalid exam', 400);

  const sectionNodeIds = input.sections.map((s) => s.nodeId).filter((id): id is string => Boolean(id));
  if (sectionNodeIds.length > 0) {
    const validNodeIds = await taxonomyRepository.listNodes().then((rows) => new Set(rows.map((n) => n.id)));
    const invalidNode = sectionNodeIds.find((id) => !validNodeIds.has(id));
    if (invalidNode) return apiError(`Invalid node id: ${invalidNode}`, 400);
  }

  const opponent = await userRepository.findByEmail(input.opponentEmail);
  if (!opponent) return apiError('No account found for that email — the opponent needs to sign up first', 404);

  try {
    const challenge = await assessmentRepository.createChallenge({
      title: input.title,
      description: input.description,
      examId: input.examId,
      sections: input.sections,
      durationSeconds: input.durationMinutes * 60,
      challengerUserId: session!.user.id,
      opponentUserId: opponent.id,
    });
    return apiSuccess(challenge, undefined, 201);
  } catch (err) {
    if (err instanceof AssessmentValidationError) {
      const detail = err.issues.map((i) => `"${i.section}": requested ${i.requested}, only ${i.available} published`).join('; ');
      return apiError(`${err.message} — ${detail}`, 400);
    }
    const message = err instanceof Error ? err.message : 'Could not create challenge';
    return apiError(message, ASSESSMENT_ERROR_STATUS[message] ?? 400);
  }
}
