import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { courseRepository } from '@/server/repositories/course.repository';
import { getMongoDb } from '@/lib/mongodb';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { CourseAnnouncementClient } from '@/types/course.types';

const CreateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  isPinned: z.boolean().default(false),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await requireAuth('TEACHER');
  if (error) return error;

  const { courseId } = await params;
  const db = await getMongoDb();
  const docs = await db.collection('courseAnnouncements')
    .find({ courseId })
    .sort({ createdAt: -1 })
    .toArray();

  const announcements = docs.map(({ _id, ...d }) => d as unknown as CourseAnnouncementClient);
  return apiSuccess(announcements);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { session, error } = await requireAuth('TEACHER');
  if (error) return error;

  const { courseId } = await params;
  const course = await courseRepository.findById(courseId);
  if (!course) return apiError('Course not found', 404);

  const body = await req.json();
  const parsed = CreateAnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getMongoDb();
  const now = new Date().toISOString();
  const announcement = {
    id: randomUUID(),
    courseId,
    ...parsed.data,
    createdBy: session!.user.id,
    createdAt: now,
  };
  await db.collection('courseAnnouncements').insertOne(announcement);
  return apiSuccess(announcement as unknown as CourseAnnouncementClient, undefined, 201);
}
