import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { UpdateExamSchema } from '@/schemas';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const exam = await examRepository.findById(id);
  if (!exam) return apiError('Exam not found', 404);
  return apiSuccess(exam);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateExamSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const exam = await examRepository.update(id, parsed.data);
  if (!exam) return apiError('Exam not found', 404);
  return apiSuccess(exam);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  try {
    await examRepository.softDelete(id);
    return apiSuccess({ deleted: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete exam';
    return Response.json({ error: message }, { status: 422 });
  }
}
