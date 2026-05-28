import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import { slugify } from '@/lib/utils';
import type { CourseClient } from '@/types/course.types';
import type { CreateCourseInput, UpdateCourseInput } from '@/schemas/course.schema';

export class MongoCourseRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('courses');
  }

  async findById(id: string): Promise<CourseClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as CourseClient;
  }

  async findBySlug(slug: string): Promise<CourseClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ slug });
    if (!doc) return null;
    return fromMongo(doc) as CourseClient;
  }

  async findAll(filters?: {
    status?: string;
    examId?: string;
    type?: string;
    teacherId?: string;
    search?: string;
  }): Promise<CourseClient[]> {
    const col = await this.col();
    const filter: Record<string, unknown> = {};

    if (filters?.status) filter.status = filters.status;
    if (filters?.examId) filter.examId = filters.examId;
    if (filters?.type) filter.type = filters.type;
    if (filters?.teacherId) filter.teacherIds = filters.teacherId;

    const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
    let results = docs.map((d) => fromMongo(d) as CourseClient);

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      results = results.filter((d) => d.title.toLowerCase().includes(s));
    }

    return results;
  }

  async findPublished(filters?: {
    examId?: string;
    type?: string;
    level?: string;
    language?: string;
    search?: string;
  }): Promise<CourseClient[]> {
    return this.findAll({ ...filters, status: 'PUBLISHED' });
  }

  async create(data: CreateCourseInput, createdBy: string): Promise<CourseClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const slug = data.slug ?? slugify(data.title);
    const course = {
      ...data,
      id,
      slug,
      enrolledCount: 0,
      totalLessons: 0,
      totalHours: 0,
      totalLiveSessions: 0,
      createdBy,
      createdAt: now,
      updatedAt: now,
      ...(data.status === 'PUBLISHED' ? { publishedAt: now } : {}),
    };
    await col.insertOne(course);
    return fromMongo(course) as CourseClient;
  }

  async update(id: string, data: UpdateCourseInput): Promise<CourseClient | null> {
    const col = await this.col();
    const existing = await col.findOne({ id });
    if (!existing) return null;

    const updates: Record<string, unknown> = { ...data, updatedAt: nowIso() };
    if (data.title && !data.slug) updates.slug = slugify(data.title);
    if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      updates.publishedAt = nowIso();
    }

    const result = await col.findOneAndUpdate({ id }, { $set: updates }, { returnDocument: 'after' });
    if (!result) return null;
    return fromMongo(result) as CourseClient;
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async incrementEnrolledCount(courseId: string, delta: number): Promise<void> {
    const col = await this.col();
    await col.updateOne({ id: courseId }, { $inc: { enrolledCount: delta }, $set: { updatedAt: nowIso() } });
  }

  async updateStats(courseId: string, stats: {
    totalLessons?: number;
    totalHours?: number;
    totalLiveSessions?: number;
  }): Promise<void> {
    const col = await this.col();
    await col.updateOne({ id: courseId }, { $set: { ...stats, updatedAt: nowIso() } });
  }

  async getStats(): Promise<{
    total: number;
    published: number;
    liveNow: number;
    totalEnrolled: number;
  }> {
    const col = await this.col();
    const db = await getMongoDb();

    const [total, published, liveNow] = await Promise.all([
      col.countDocuments({}),
      col.countDocuments({ status: 'PUBLISHED' }),
      db.collection('liveSessions').countDocuments({ status: 'LIVE' }),
    ]);

    const publishedCourses = await col.find({ status: 'PUBLISHED' }, { projection: { enrolledCount: 1 } }).toArray();
    const totalEnrolled = publishedCourses.reduce((sum, c) => sum + ((c.enrolledCount as number) ?? 0), 0);

    return { total, published, liveNow, totalEnrolled };
  }
}
