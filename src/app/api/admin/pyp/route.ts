import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { pypRepository } from '@/server/repositories/pyp.repository';
import { examRepository } from '@/server/repositories/exam.repository';
import { CreatePYPSchema } from '@/schemas';

export async function GET(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId') ?? undefined;
  const activeOnly = searchParams.get('activeOnly') !== 'false';

  try {
    if (examId) {
      const pyps = await pypRepository.findByExam(examId, activeOnly);
      return apiSuccess(pyps);
    }
    const pyps = await pypRepository.findAll(activeOnly);
    return apiSuccess(pyps);
  } catch (err) {
    console.error('[admin/pyp GET]', err);
    return apiError('Internal server error', 500);
  }
}

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const body = await req.json();
  const parsed = CreatePYPSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const exam = await examRepository.findById(parsed.data.examId);
    if (!exam) return apiError('Exam not found', 404);

    const pyp = await pypRepository.create(parsed.data, exam.name, exam.slug);
    return apiSuccess(pyp, undefined, 201);
  } catch (err) {
    console.error('[admin/pyp POST]', err);
    return apiError('Internal server error', 500);
  }
}
