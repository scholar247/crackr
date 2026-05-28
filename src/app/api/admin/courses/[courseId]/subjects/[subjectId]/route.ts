import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { UpdateCourseSubjectSchema } from '@/schemas/course.schema';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { subjectId } = await params;
  const body = await req.json();
  const parsed = UpdateCourseSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const subject = await courseSubjectRepository.update(subjectId, parsed.data);
  if (!subject) return apiError('Subject not found', 404);
  return apiSuccess(subject);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { subjectId } = await params;
  const ok = await courseSubjectRepository.delete(subjectId);
  if (!ok) return apiError('Subject not found', 404);
  return apiSuccess({ ok: true });
}
