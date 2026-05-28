import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { UpdateCourseSchema } from '@/schemas/course.schema';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);
  return apiSuccess(course);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const body = await req.json();
  const parsed = UpdateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const course = await courseRepository.update(courseId, parsed.data);
  if (!course) return apiError('Course not found', 404);
  return apiSuccess(course);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const ok = await courseRepository.delete(courseId);
  if (!ok) return apiError('Course not found', 404);
  return apiSuccess({ ok: true });
}
