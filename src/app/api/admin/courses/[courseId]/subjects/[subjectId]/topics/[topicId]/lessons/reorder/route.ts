import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';
import { ReorderCourseLessonsSchema } from '@/schemas/course.schema';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; subjectId: string; topicId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { topicId } = await params;
  const body = await req.json();
  const parsed = ReorderCourseLessonsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  await courseLessonRepository.reorder(topicId, parsed.data.orderedIds);
  return apiSuccess({ ok: true });
}
