import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { MockSessionClient, TestAttemptClient } from '@/types';
import type { MockFiltersInput } from '@/schemas';

export class MongoMockRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('mockSessions');
  }

  async create(userId: string, filters: MockFiltersInput, mcqIds: string[]): Promise<MockSessionClient> {
    const col = await this.col();
    const id = generateId();
    const session = { id, userId, filters, mcqIds, createdAt: nowIso() };
    await col.insertOne(session);
    return fromMongo(session) as MockSessionClient;
  }

  async findById(id: string): Promise<MockSessionClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as MockSessionClient;
  }

  async findByUser(userId: string, opts?: { page?: number; pageSize?: number }): Promise<{ items: MockSessionClient[]; total: number }> {
    const col = await this.col();
    const pageSize = opts?.pageSize ?? 20;
    const page = opts?.page ?? 1;
    const skip = (page - 1) * pageSize;

    const [total, docs] = await Promise.all([
      col.countDocuments({ userId }),
      col.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
    ]);

    return {
      items: docs.map((d) => fromMongo(d) as MockSessionClient),
      total,
    };
  }

  async attachAttempt(sessionId: string, attempt: TestAttemptClient): Promise<MockSessionClient | null> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { id: sessionId },
      { $set: { attempt } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as MockSessionClient;
  }
}
