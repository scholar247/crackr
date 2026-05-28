import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { ReorderCourseTopicsSchema } from '@/schemas/course.schema';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { subjectId } = await params;
  const body = await req.json();
  const parsed = ReorderCourseTopicsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  await courseTopicRepository.reorder(subjectId, parsed.data.orderedIds);
  return apiSuccess({ ok: true });
}
