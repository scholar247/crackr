import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { mockService } from '@/server/services/mock.service';
import { GenerateMockSchema } from '@/schemas';
import { courseRepository } from '@/server/repositories/course.repository';
import { courseTopicRepository } from '@/server/repositories/courseTopic.repository';
import { z } from 'zod';

const ExtendedGenerateMockSchema = GenerateMockSchema.extend({
  courseId: z.string().optional(),
  courseTopicId: z.string().optional(),
  courseSubjectId: z.string().optional(),
});

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = ExtendedGenerateMockSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { courseId, courseTopicId, filters } = parsed.data;
    let finalFilters = { ...filters };

    if (courseId && !courseTopicId) {
      const course = await courseRepository.findById(courseId);
      if (course) {
        finalFilters.examId = course.examId;
        const topics = await courseTopicRepository.findByCourse(courseId);
        const globalTopicIds = topics
          .filter((t) => t.globalTopicId)
          .map((t) => t.globalTopicId as string);
        if (globalTopicIds.length > 0) {
          finalFilters.topicIds = globalTopicIds;
        }
      }
    } else if (courseTopicId) {
      const topic = await courseTopicRepository.findById(courseTopicId);
      if (topic?.globalTopicId) {
        finalFilters.topicIds = [topic.globalTopicId];
        if (courseId) {
          const course = await courseRepository.findById(courseId);
          if (course) finalFilters.examId = course.examId;
        }
      }
    }

    const session_ = session!;
    const mock = await mockService.generate(session_.user.id, { filters: finalFilters });
    return apiSuccess(mock, undefined, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate mock';
    return Response.json({ error: message }, { status: 422 });
  }
}
