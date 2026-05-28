import { apiSuccess } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { examRepository } from '@/server/repositories/exam.repository';

export async function GET() {
  const [courses, exams] = await Promise.all([
    courseRepository.findPublished(),
    examRepository.findAll(true),
  ]);
  return apiSuccess({ courses, exams });
}
