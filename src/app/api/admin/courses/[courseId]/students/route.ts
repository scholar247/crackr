import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { enrollmentRepository } from '@/server/repositories/enrollment.repository';
import { courseRepository } from '@/server/repositories/course.repository';
import { AdminEnrollStudentSchema } from '@/schemas/course.schema';
import { userRepository } from '@/server/repositories/user.repository';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const enrollments = await enrollmentRepository.findByCourse(courseId);

  const userIds = enrollments.map((e) => e.userId);
  const users = userIds.length > 0 ? await userRepository.findByIds(userIds) : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enriched = enrollments.map((e) => ({
    ...e,
    user: userMap.get(e.userId),
  }));

  return apiSuccess(enriched);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const body = await req.json();
  const parsed = AdminEnrollStudentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);

  const existing = await enrollmentRepository.findOne(courseId, parsed.data.userId);
  const enrollment = await enrollmentRepository.enroll(courseId, parsed.data.userId);

  if (!existing) {
    await courseRepository.incrementEnrolledCount(courseId, 1);
  }

  return apiSuccess(enrollment, undefined, 201);
}
