import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository, AssessmentValidationError } from '@/server/repositories/assessment.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { CreateOpenMockSchema } from '@/schemas/self-mock.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// Any signed-in user can publish an open mock — same "no min role" precedent as self-mocks
// and group tests. What makes it "open" isn't who can create it, it's who can take it:
// createOpenMock grants PUBLIC access, and checkAccess only lets it through to viewers who
// have this exam in their user_exam_targets.
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const parsed = CreateOpenMockSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const exam = await taxonomyRepository.findExamById(parsed.data.examId);
  if (!exam || exam.status !== 'ACTIVE') return apiError('Invalid exam', 400);

  try {
    const created = await assessmentRepository.createOpenMock({
      title: parsed.data.title,
      description: parsed.data.description,
      examId: parsed.data.examId,
      questionsPerSubject: parsed.data.questionsPerSubject,
      marksPerQuestion: parsed.data.marksPerQuestion,
      negativeMarksPerQuestion: parsed.data.negativeMarksPerQuestion,
      difficulty: parsed.data.difficulty,
      durationSeconds: parsed.data.durationMinutes * 60,
      maxAttempts: parsed.data.maxAttempts ?? null,
      creatorUserId: session!.user.id,
      studentInstructions: parsed.data.studentInstructions,
      tags: parsed.data.tags,
      bannerImage: parsed.data.bannerImage,
    });
    return apiSuccess(created, undefined, 201);
  } catch (err) {
    if (err instanceof Error && err.message === 'EXAM_HAS_NO_SUBJECTS') {
      return apiError('This exam has no subjects set up yet, so an open mock can\'t be built for it.', 400);
    }
    if (err instanceof Error && err.message === 'TOO_MANY_SUBJECTS_FOR_ONE_MOCK') {
      return apiError('This exam has too many subjects to fit in a single mock.', 400);
    }
    if (err instanceof AssessmentValidationError) {
      const detail = err.issues.map((i) => `"${i.section}": requested ${i.requested}, only ${i.available} published`).join('; ');
      return apiError(`Not enough published questions — ${detail}`, 400);
    }
    throw err;
  }
}
