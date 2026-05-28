import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { CourseSubjectClient } from '@/types/course.types';
import type { CreateCourseSubjectInput, UpdateCourseSubjectInput } from '@/schemas/course.schema';

export class MongoCourseSubjectRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('courseSubjects');
  }

  async findById(id: string): Promise<CourseSubjectClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as CourseSubjectClient;
  }

  async findByCourse(courseId: string): Promise<CourseSubjectClient[]> {
    const col = await this.col();
    const docs = await col.find({ courseId }).sort({ order: 1 }).toArray();
    return docs.map((d) => fromMongo(d) as CourseSubjectClient);
  }

  async create(data: CreateCourseSubjectInput): Promise<CourseSubjectClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const subject = { ...data, id, lessonCount: 0, topicCount: 0, createdAt: now, updatedAt: now };
    await col.insertOne(subject);
    return fromMongo(subject) as CourseSubjectClient;
  }

  async update(id: string, data: UpdateCourseSubjectInput): Promise<CourseSubjectClient | null> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { id },
      { $set: { ...data, updatedAt: nowIso() } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as CourseSubjectClient;
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async reorder(_courseId: string, orderedIds: string[]): Promise<void> {
    const col = await this.col();
    const now = nowIso();
    await Promise.all(
      orderedIds.map((id, index) =>
        col.updateOne({ id }, { $set: { order: index, updatedAt: now } })
      )
    );
  }

  async incrementTopicCount(id: string, delta: number): Promise<void> {
    const col = await this.col();
    await col.updateOne({ id }, { $inc: { topicCount: delta }, $set: { updatedAt: nowIso() } });
  }

  async incrementLessonCount(id: string, delta: number): Promise<void> {
    const col = await this.col();
    await col.updateOne({ id }, { $inc: { lessonCount: delta }, $set: { updatedAt: nowIso() } });
  }
}
