import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { CreateExamSchema } from '@/schemas';

export async function GET(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? undefined;
  const subjectId = searchParams.get('subjectId') ?? undefined;
  const activeOnly = searchParams.get('activeOnly') !== 'false';

  if (subjectId) {
    const exams = await examRepository.findBySubject(subjectId);
    return apiSuccess(exams);
  }

  if (category) {
    const exams = await examRepository.findByCategory(category, activeOnly);
    return apiSuccess(exams);
  }

  const exams = await examRepository.findAll(activeOnly);
  return apiSuccess(exams);
}

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const body = await req.json();
  const parsed = CreateExamSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const exam = await examRepository.create(parsed.data);
    return apiSuccess(exam, undefined, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create exam';
    return Response.json({ error: message }, { status: 422 });
  }
}
