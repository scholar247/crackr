import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { courseSubjectRepository } from '@/server/repositories/courseSubject.repository';
import { CreateCourseSubjectSchema } from '@/schemas/course.schema';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const subjects = await courseSubjectRepository.findByCourse(courseId);
  return apiSuccess(subjects);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { courseId } = await params;
  const body = await req.json();
  const parsed = CreateCourseSubjectSchema.safeParse({ ...body, courseId });
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const subject = await courseSubjectRepository.create(parsed.data);
  return apiSuccess(subject, undefined, 201);
}
