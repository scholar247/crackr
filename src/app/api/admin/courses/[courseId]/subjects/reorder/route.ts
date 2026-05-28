import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { ReorderCourseSubjectsSchema } from '@/schemas/course.schema';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const body = await req.json();
  const parsed = ReorderCourseSubjectsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  await courseSubjectRepository.reorder(courseId, parsed.data.orderedIds);
  return apiSuccess({ ok: true });
}
