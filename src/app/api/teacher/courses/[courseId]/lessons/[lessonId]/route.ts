import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { courseLessonRepository } from '@/server/repositories/courseLesson.repository';
import { UpdateCourseLessonSchema } from '@/schemas/course.schema';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const { courseId, lessonId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);
  if (session!.user.role === 'TEACHER' && !course.teacherIds.includes(session!.user.id)) {
    return apiError('Forbidden', 403);
  }

  const lesson = await courseLessonRepository.findById(lessonId);
  if (!lesson) return apiError('Lesson not found', 404);
  return apiSuccess(lesson);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const { courseId, lessonId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);
  if (session!.user.role === 'TEACHER' && !course.teacherIds.includes(session!.user.id)) {
    return apiError('Forbidden', 403);
  }

  const body = await req.json();
  const parsed = UpdateCourseLessonSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  // Teachers can only update content fields, not structural ones
  const allowed = {
    videoUrl: parsed.data.videoUrl,
    textContent: parsed.data.textContent,
    pdfUrl: parsed.data.pdfUrl,
    pdfDisplayName: parsed.data.pdfDisplayName,
    notesUrl: parsed.data.notesUrl,
    notesName: parsed.data.notesName,
    description: parsed.data.description,
    linkedTestId: parsed.data.linkedTestId,
    isFree: parsed.data.isFree,
    duration: parsed.data.duration,
  };
  // Remove undefined
  const data = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined));

  const lesson = await courseLessonRepository.update(lessonId, data);
  if (!lesson) return apiError('Lesson not found', 404);
  return apiSuccess(lesson);
}
