import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { CourseLessonClient } from '@/types/course.types';
import type { CreateCourseLessonInput, UpdateCourseLessonInput } from '@/schemas/course.schema';

export class MongoCourseLessonRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('courseLessons');
  }

  async findById(id: string): Promise<CourseLessonClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as CourseLessonClient;
  }

  async findByTopic(courseTopicId: string): Promise<CourseLessonClient[]> {
    const col = await this.col();
    const docs = await col.find({ courseTopicId }).sort({ order: 1 }).toArray();
    return docs.map((d) => fromMongo(d) as CourseLessonClient);
  }

  async findByCourse(courseId: string): Promise<CourseLessonClient[]> {
    const col = await this.col();
    const docs = await col.find({ courseId }).toArray();
    return docs.map((d) => fromMongo(d) as CourseLessonClient);
  }

  async create(data: CreateCourseLessonInput): Promise<CourseLessonClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const lesson = { ...data, id, createdAt: now, updatedAt: now };
    await col.insertOne(lesson);
    return fromMongo(lesson) as CourseLessonClient;
  }

  async update(id: string, data: UpdateCourseLessonInput): Promise<CourseLessonClient | null> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { id },
      { $set: { ...data, updatedAt: nowIso() } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as CourseLessonClient;
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async reorder(_courseTopicId: string, orderedIds: string[]): Promise<void> {
    const col = await this.col();
    const now = nowIso();
    await Promise.all(
      orderedIds.map((id, index) =>
        col.updateOne({ id }, { $set: { order: index, updatedAt: now } })
      )
    );
  }

  async countByCourse(courseId: string): Promise<number> {
    const col = await this.col();
    return col.countDocuments({ courseId });
  }
}
