import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { LiveSessionClient } from '@/types/course.types';
import type { CreateLiveSessionInput, UpdateLiveSessionInput, GoLiveInput } from '@/schemas/course.schema';

export class MongoLiveSessionRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('liveSessions');
  }

  async findById(id: string): Promise<LiveSessionClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as LiveSessionClient;
  }

  async findByCourse(courseId: string): Promise<LiveSessionClient[]> {
    const col = await this.col();
    const docs = await col.find({ courseId }).sort({ scheduledAt: 1 }).toArray();
    return docs.map((d) => fromMongo(d) as LiveSessionClient);
  }

  async findUpcomingByCourse(courseId: string): Promise<LiveSessionClient[]> {
    const col = await this.col();
    const now = new Date().toISOString();
    const docs = await col
      .find({ courseId, scheduledAt: { $gte: now }, status: { $in: ['SCHEDULED', 'LIVE'] } })
      .sort({ scheduledAt: 1 })
      .toArray();
    return docs.map((d) => fromMongo(d) as LiveSessionClient);
  }

  async findPastByCourse(courseId: string): Promise<LiveSessionClient[]> {
    const col = await this.col();
    const docs = await col
      .find({ courseId, status: { $in: ['COMPLETED', 'CANCELLED'] } })
      .sort({ scheduledAt: -1 })
      .toArray();
    return docs.map((d) => fromMongo(d) as LiveSessionClient);
  }

  async findByTeacher(teacherId: string): Promise<LiveSessionClient[]> {
    const col = await this.col();
    const docs = await col.find({ teacherId }).sort({ scheduledAt: -1 }).toArray();
    return docs.map((d) => fromMongo(d) as LiveSessionClient);
  }

  async findLiveNow(): Promise<LiveSessionClient[]> {
    const col = await this.col();
    const docs = await col.find({ status: 'LIVE' }).toArray();
    return docs.map((d) => fromMongo(d) as LiveSessionClient);
  }

  async findUpcomingForCourses(courseIds: string[]): Promise<LiveSessionClient[]> {
    if (courseIds.length === 0) return [];
    const col = await this.col();
    const now = new Date().toISOString();
    const docs = await col
      .find({ courseId: { $in: courseIds }, scheduledAt: { $gte: now }, status: { $in: ['SCHEDULED', 'LIVE'] } })
      .sort({ scheduledAt: 1 })
      .toArray();
    return docs.map((d) => fromMongo(d) as LiveSessionClient);
  }

  async create(data: CreateLiveSessionInput): Promise<LiveSessionClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const session = {
      ...data,
      id,
      status: 'SCHEDULED',
      attendanceCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(session);
    return fromMongo(session) as LiveSessionClient;
  }

  async update(id: string, data: UpdateLiveSessionInput): Promise<LiveSessionClient | null> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { id },
      { $set: { ...data, updatedAt: nowIso() } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as LiveSessionClient;
  }

  async goLive(id: string, data: GoLiveInput): Promise<LiveSessionClient | null> {
    const col = await this.col();
    const now = nowIso();
    const result = await col.findOneAndUpdate(
      { id },
      { $set: { status: 'LIVE', joinUrl: data.joinUrl, startedAt: now, updatedAt: now } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as LiveSessionClient;
  }

  async complete(id: string, recordingUrl?: string): Promise<LiveSessionClient | null> {
    const col = await this.col();
    const now = nowIso();
    const updates: Record<string, unknown> = { status: 'COMPLETED', endedAt: now, updatedAt: now };
    if (recordingUrl) updates.recordingUrl = recordingUrl;
    const result = await col.findOneAndUpdate({ id }, { $set: updates }, { returnDocument: 'after' });
    if (!result) return null;
    return fromMongo(result) as LiveSessionClient;
  }

  async cancel(id: string): Promise<LiveSessionClient | null> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { id },
      { $set: { status: 'CANCELLED', updatedAt: nowIso() } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as LiveSessionClient;
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.deleteOne({ id });
    return result.deletedCount > 0;
  }

  getVisibleJoinUrl(session: LiveSessionClient): string | null {
    if (session.status === 'LIVE') return session.joinUrl ?? null;
    if (!session.joinUrl) return null;
    const scheduledMs = new Date(session.scheduledAt).getTime();
    const visibleFrom = scheduledMs - session.joinUrlVisibleMinutesBefore * 60 * 1000;
    if (Date.now() >= visibleFrom) return session.joinUrl;
    return null;
  }
}
