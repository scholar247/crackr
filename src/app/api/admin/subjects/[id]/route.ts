import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { UpdateSubjectSchema } from '@/schemas';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const subject = await subjectRepository.update(id, parsed.data);
  if (!subject) return apiError('Subject not found', 404);
  return apiSuccess(subject);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const deleted = await subjectRepository.softDelete(id);
  if (!deleted) return apiError('Subject not found', 404);
  return apiSuccess({ deleted: true });
}
