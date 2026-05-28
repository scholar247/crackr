import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { TestClient, TestAttemptClient } from '@/types';
import type { CreateTestInput, UpdateTestInput, SubmitAttemptInput } from '@/schemas';

export class MongoTestRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('tests');
  }

  private async attemptsCol() {
    const db = await getMongoDb();
    return db.collection('testAttempts');
  }

  async findById(id: string): Promise<TestClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as TestClient;
  }

  async findForUser(userId: string, groupIds: string[]): Promise<TestClient[]> {
    const col = await this.col();
    const conditions: Record<string, unknown>[] = [
      { status: 'PUBLISHED', accessType: 'ALL' },
      { status: 'PUBLISHED', allowedUserIds: userId },
    ];
    if (groupIds.length > 0) {
      conditions.push({ status: 'PUBLISHED', allowedGroupIds: { $in: groupIds } });
    }
    const docs = await col.find({ $or: conditions }).toArray();
    const seen = new Map<string, TestClient>();
    for (const d of docs) {
      const t = fromMongo(d) as TestClient;
      seen.set(t.id, t);
    }
    return Array.from(seen.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findAll(opts?: { page?: number; pageSize?: number }): Promise<{ items: TestClient[]; total: number }> {
    const col = await this.col();
    const pageSize = opts?.pageSize ?? 20;
    const page = opts?.page ?? 1;
    const skip = (page - 1) * pageSize;

    const [total, docs] = await Promise.all([
      col.countDocuments({}),
      col.find({}).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
    ]);

    return {
      items: docs.map((d) => fromMongo(d) as TestClient),
      total,
    };
  }

  async create(data: CreateTestInput, createdBy: string): Promise<TestClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const test = {
      ...data,
      id,
      startAt: data.startAt ?? null,
      endAt: data.endAt ?? null,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(test);
    return fromMongo(test) as TestClient;
  }

  async update(id: string, data: UpdateTestInput): Promise<TestClient | null> {
    const col = await this.col();
    const updates = { ...data, updatedAt: nowIso() };
    const result = await col.findOneAndUpdate({ id }, { $set: updates }, { returnDocument: 'after' });
    if (!result) return null;
    return fromMongo(result) as TestClient;
  }

  // ─── Attempts ────────────────────────────────────────────────────────────────

  async startAttempt(testId: string, userId: string, shuffledMcqIds: string[]): Promise<TestAttemptClient> {
    const col = await this.attemptsCol();
    const id = generateId();
    const attempt = {
      id,
      testId,
      userId,
      shuffledMcqIds,
      responses: [],
      totalMarks: 0,
      marksObtained: 0,
      timeTakenSeconds: 0,
      status: 'IN_PROGRESS',
      startedAt: nowIso(),
    };
    await col.insertOne(attempt);
    return fromMongo(attempt) as TestAttemptClient;
  }

  async findAttempt(attemptId: string): Promise<TestAttemptClient | null> {
    const col = await this.attemptsCol();
    const doc = await col.findOne({ id: attemptId });
    if (!doc) return null;
    return fromMongo(doc) as TestAttemptClient;
  }

  async findUserAttempt(testId: string, userId: string): Promise<TestAttemptClient | null> {
    const col = await this.attemptsCol();
    const doc = await col.findOne({ testId, userId });
    if (!doc) return null;
    return fromMongo(doc) as TestAttemptClient;
  }

  async submitAttempt(
    attemptId: string,
    data: SubmitAttemptInput,
    evaluated: {
      responses: TestAttemptClient['responses'];
      marksObtained: number;
      totalMarks: number;
    }
  ): Promise<TestAttemptClient> {
    const col = await this.attemptsCol();
    const result = await col.findOneAndUpdate(
      { id: attemptId },
      {
        $set: {
          responses: evaluated.responses,
          marksObtained: evaluated.marksObtained,
          totalMarks: evaluated.totalMarks,
          timeTakenSeconds: data.timeTakenSeconds,
          status: 'EVALUATED',
          submittedAt: nowIso(),
        },
      },
      { returnDocument: 'after' }
    );
    if (!result) throw new Error('Attempt not found');
    return fromMongo(result) as TestAttemptClient;
  }

  async getTestAttempts(testId: string): Promise<TestAttemptClient[]> {
    const col = await this.attemptsCol();
    const docs = await col.find({ testId, status: 'EVALUATED' }).toArray();
    return docs.map((d) => fromMongo(d) as TestAttemptClient);
  }

  async getUserAttempts(userId: string): Promise<TestAttemptClient[]> {
    const col = await this.attemptsCol();
    const docs = await col.find({ userId }).sort({ submittedAt: -1 }).toArray();
    return docs.map((d) => fromMongo(d) as TestAttemptClient);
  }
}
