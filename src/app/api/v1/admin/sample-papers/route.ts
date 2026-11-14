import { requireAuth, DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import { samplePaperRepository } from '@/server/repositories/sample-paper.repository';
import { revalidateSamplePaperPages } from '@/server/services/sample-papers';
import { SamplePaperSchema } from '@/schemas/sample-paper.schema';
import { isDuplicateKeyError } from '@/server/db/helpers';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const [rows, exams] = await Promise.all([samplePaperRepository.listAll(), samplePaperRepository.listEligibleExams()]);
  return apiSuccess(rows, { exams });
}

export async function POST(req: Request) {
  const { session, error, isServiceKey } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = SamplePaperSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const eligible = await samplePaperRepository.listEligibleExams();
  if (!eligible.some((e) => e.id === parsed.data.examId)) return apiError('Sample papers are not enabled for this exam', 400);

  try {
    const createdBy = isServiceKey ? DEFAULT_CONTENT_AUTHOR_ID : session!.user.id;
    const paper = await samplePaperRepository.create(parsed.data, createdBy);
    revalidateSamplePaperPages();
    return apiSuccess(paper, undefined, 201);
  } catch (err) {
    if (isDuplicateKeyError(err)) return apiError('A paper for this exam, year and subject already exists', 409);
    throw err;
  }
}
