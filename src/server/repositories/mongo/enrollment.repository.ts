import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { EnrollmentClient } from '@/types/course.types';

export class MongoEnrollmentRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('enrollments');
  }

  async findByCourse(courseId: string): Promise<EnrollmentClient[]> {
    const col = await this.col();
    const docs = await col.find({ courseId, status: 'ACTIVE' }).toArray();
    return docs.map((d) => fromMongo(d) as EnrollmentClient);
  }

  async findByUser(userId: string): Promise<EnrollmentClient[]> {
    const col = await this.col();
    const docs = await col.find({ userId, status: 'ACTIVE' }).toArray();
    return docs.map((d) => fromMongo(d) as EnrollmentClient);
  }

  async findOne(courseId: string, userId: string): Promise<EnrollmentClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ courseId, userId });
    if (!doc) return null;
    return fromMongo(doc) as EnrollmentClient;
  }

  async enroll(courseId: string, userId: string): Promise<EnrollmentClient> {
    const col = await this.col();
    const existing = await col.findOne({ courseId, userId });

    if (existing) {
      if ((existing.status as string) === 'ACTIVE') {
        return fromMongo(existing) as EnrollmentClient;
      }
      const result = await col.findOneAndUpdate(
        { courseId, userId },
        { $set: { status: 'ACTIVE', updatedAt: nowIso() } },
        { returnDocument: 'after' }
      );
      return fromMongo(result!) as EnrollmentClient;
    }

    const now = nowIso();
    const enrollment = {
      id: generateId(),
      courseId,
      userId,
      status: 'ACTIVE',
      progress: 0,
      completedLessonIds: [],
      enrolledAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(enrollment);
    return fromMongo(enrollment) as EnrollmentClient;
  }

  async unenroll(courseId: string, userId: string): Promise<void> {
    const col = await this.col();
    await col.updateOne({ courseId, userId }, { $set: { status: 'CANCELLED', updatedAt: nowIso() } });
  }

  async markLessonComplete(
    courseId: string,
    userId: string,
    lessonId: string,
    totalLessons: number
  ): Promise<EnrollmentClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ courseId, userId });
    if (!doc) return null;

    const completedIds: string[] = (doc.completedLessonIds as string[]) ?? [];
    if (completedIds.includes(lessonId)) {
      return fromMongo(doc) as EnrollmentClient;
    }

    const newCompleted = [...completedIds, lessonId];
    const progress = totalLessons > 0 ? Math.round((newCompleted.length / totalLessons) * 100) : 0;
    const isCompleted = progress >= 100;
    const now = nowIso();

    const updates: Record<string, unknown> = {
      completedLessonIds: newCompleted,
      lastLessonId: lessonId,
      lastAccessedAt: now,
      progress,
      updatedAt: now,
    };
    if (isCompleted) {
      updates.status = 'COMPLETED';
      updates.completedAt = now;
    }

    const result = await col.findOneAndUpdate(
      { courseId, userId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as EnrollmentClient;
  }

  async updateLastAccessed(courseId: string, userId: string, lessonId: string): Promise<void> {
    const col = await this.col();
    await col.updateOne(
      { courseId, userId },
      { $set: { lastLessonId: lessonId, lastAccessedAt: nowIso(), updatedAt: nowIso() } }
    );
  }

  async countByCourse(courseId: string): Promise<number> {
    const col = await this.col();
    return col.countDocuments({ courseId, status: 'ACTIVE' });
  }

  async getActiveInLast7Days(courseId: string): Promise<number> {
    const col = await this.col();
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return col.countDocuments({ courseId, status: 'ACTIVE', lastAccessedAt: { $gte: cutoff } });
  }
}
