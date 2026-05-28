import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { CreateCourseSchema } from '@/schemas/course.schema';

export async function GET(req: Request) {
  const { session, error } = await requireAuth('ADMIN');
  if (error) return error;
  void session;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const examId = searchParams.get('examId') ?? undefined;
  const type = searchParams.get('type') ?? undefined;
  const teacherId = searchParams.get('teacherId') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const courses = await courseRepository.findAll({ status, examId, type, teacherId, search });
  return apiSuccess(courses);
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth('ADMIN');
  if (error) return error;

  const body = await req.json();
  const parsed = CreateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const course = await courseRepository.create(parsed.data, session!.user.id);
    return apiSuccess(course, undefined, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create course';
    return Response.json({ error: message }, { status: 422 });
  }
}
