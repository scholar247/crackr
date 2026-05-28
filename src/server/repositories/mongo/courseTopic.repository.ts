import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { CourseTopicClient } from '@/types/course.types';
import type { CreateCourseTopicInput, UpdateCourseTopicInput } from '@/schemas/course.schema';

export class MongoCourseTopicRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('courseTopics');
  }

  async findById(id: string): Promise<CourseTopicClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as CourseTopicClient;
  }

  async findBySubject(courseSubjectId: string): Promise<CourseTopicClient[]> {
    const col = await this.col();
    const docs = await col.find({ courseSubjectId }).sort({ order: 1 }).toArray();
    return docs.map((d) => fromMongo(d) as CourseTopicClient);
  }

  async findByCourse(courseId: string): Promise<CourseTopicClient[]> {
    const col = await this.col();
    const docs = await col.find({ courseId }).toArray();
    return docs.map((d) => fromMongo(d) as CourseTopicClient);
  }

  async create(data: CreateCourseTopicInput): Promise<CourseTopicClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const topic = { ...data, id, lessonCount: 0, createdAt: now, updatedAt: now };
    await col.insertOne(topic);
    return fromMongo(topic) as CourseTopicClient;
  }

  async update(id: string, data: UpdateCourseTopicInput): Promise<CourseTopicClient | null> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { id },
      { $set: { ...data, updatedAt: nowIso() } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as CourseTopicClient;
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async reorder(_courseSubjectId: string, orderedIds: string[]): Promise<void> {
    const col = await this.col();
    const now = nowIso();
    await Promise.all(
      orderedIds.map((id, index) =>
        col.updateOne({ id }, { $set: { order: index, updatedAt: now } })
      )
    );
  }

  async incrementLessonCount(id: string, delta: number): Promise<void> {
    const col = await this.col();
    await col.updateOne({ id }, { $inc: { lessonCount: delta }, $set: { updatedAt: nowIso() } });
  }
}
