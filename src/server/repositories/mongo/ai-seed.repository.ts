import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { ContentSeed, ContentSeedClient, SeedKind, BlogType, Difficulty } from '@/types';
import type { SeedListQuery } from '@/schemas/ai-seed.schema';

export interface SeedListResult {
  items: ContentSeedClient[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSeedInput {
  kind: SeedKind;
  examId: string;
  subjectId: string;
  topicId: string;

  articleType?: BlogType;
  angleHint?: string;

  targetCount?: number;
  difficultyMix?: Partial<Record<Difficulty, number>>;
  includePYQ?: boolean;
  autoCreateSubtopics?: boolean;

  planRunId: string;
  createdBy: string;
  creatorEmail: string;
  maxAttempts?: number;
}

// A crashed/stuck job's claim becomes re-claimable after this long.
const STALE_LOCK_MS = 10 * 60 * 1000;

export class MongoContentSeedRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('aiContentSeeds');
  }

  async ensureIndexes(): Promise<void> {
    const col = await this.col();
    await Promise.all([
      col.createIndex({ kind: 1, status: 1 }),
      col.createIndex({ topicId: 1, kind: 1 }),
      col.createIndex({ planRunId: 1 }),
      col.createIndex({ status: 1, lockedAt: 1 }),
      col.createIndex({ createdAt: -1 }),
    ]);
  }

  async findById(id: string): Promise<ContentSeedClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    return doc ? (fromMongo(doc) as ContentSeedClient) : null;
  }

  async list(query: SeedListQuery): Promise<SeedListResult> {
    const col = await this.col();
    const filter: Record<string, unknown> = {};
    if (query.kind) filter.kind = query.kind;
    if (query.status) filter.status = query.status;
    if (query.planRunId) filter.planRunId = query.planRunId;

    const pageSize = query.pageSize ?? 20;
    const page = query.page ?? 1;
    const skip = (page - 1) * pageSize;

    const [total, docs] = await Promise.all([
      col.countDocuments(filter),
      col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
    ]);

    return {
      items: docs.map((d) => fromMongo(d) as ContentSeedClient),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(data: CreateSeedInput): Promise<ContentSeedClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const doc: ContentSeed = {
      ...data,
      id,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: data.maxAttempts ?? 3,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc);
    return fromMongo(doc) as ContentSeedClient;
  }

  /** Idempotency guard for the planner — is there already an in-flight seed for this scope? */
  async hasActiveSeed(opts: { topicId: string; kind: SeedKind; articleType?: string }): Promise<boolean> {
    const col = await this.col();
    const filter: Record<string, unknown> = {
      topicId: opts.topicId,
      kind: opts.kind,
      status: { $in: ['PENDING', 'GENERATING'] },
    };
    if (opts.articleType) filter.articleType = opts.articleType;
    const count = await col.countDocuments(filter);
    return count > 0;
  }

  /** Atomically claim one seed matching extra criteria, moving PENDING -> GENERATING. */
  async claimNext(extraFilter: Record<string, unknown>): Promise<ContentSeedClient | null> {
    const col = await this.col();
    const staleBefore = new Date(Date.now() - STALE_LOCK_MS).toISOString();
    const filter = {
      status: 'PENDING',
      $or: [{ lockedAt: { $exists: false } }, { lockedAt: { $lt: staleBefore } }],
      ...extraFilter,
    };
    const now = nowIso();
    const result = await col.findOneAndUpdate(
      filter,
      { $set: { status: 'GENERATING', lockedAt: now, startedAt: now, updatedAt: now } },
      { returnDocument: 'after' }
    );
    return result ? (fromMongo(result) as ContentSeedClient) : null;
  }

  /** MCQ Seeder claims a not-yet-scoped seed for scope resolution — status stays PENDING (scoping isn't generation). */
  async claimForScoping(): Promise<ContentSeedClient | null> {
    const col = await this.col();
    const staleBefore = new Date(Date.now() - STALE_LOCK_MS).toISOString();
    const now = nowIso();
    const result = await col.findOneAndUpdate(
      {
        kind: 'MCQ',
        status: 'PENDING',
        resolvedTopicId: { $exists: false },
        $or: [{ lockedAt: { $exists: false } }, { lockedAt: { $lt: staleBefore } }],
      },
      { $set: { lockedAt: now, updatedAt: now } },
      { returnDocument: 'after' }
    );
    return result ? (fromMongo(result) as ContentSeedClient) : null;
  }

  /** MCQ Seeder resolves scope without claiming GENERATING — leaves status PENDING, now "scoped". */
  async resolveScope(id: string, resolvedTopicId: string): Promise<void> {
    const col = await this.col();
    await col.updateOne(
      { id },
      { $set: { resolvedTopicId, updatedAt: nowIso() }, $unset: { lockedAt: '' } }
    );
  }

  async markDone(id: string, result: { resultBlogId?: string; resultMcqIds?: string[] }): Promise<void> {
    const col = await this.col();
    await col.updateOne(
      { id },
      { $set: { status: 'DONE', ...result, completedAt: nowIso(), updatedAt: nowIso() }, $unset: { lockedAt: '' } }
    );
  }

  /** Records a failure; retries (back to PENDING) while under maxAttempts, else terminal FAILED. */
  async markFailed(id: string, error: string): Promise<void> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return;
    const attempts = ((doc.attempts as number) ?? 0) + 1;
    const maxAttempts = (doc.maxAttempts as number) ?? 3;
    const status = attempts < maxAttempts ? 'PENDING' : 'FAILED';
    await col.updateOne(
      { id },
      { $set: { status, attempts, lastError: error, updatedAt: nowIso() }, $unset: { lockedAt: '' } }
    );
  }

  /** Admin-triggered retry — re-queues a FAILED seed regardless of attempts (keeps attempts for visibility). */
  async retry(id: string): Promise<ContentSeedClient | null> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { id, status: 'FAILED' },
      { $set: { status: 'PENDING', updatedAt: nowIso() }, $unset: { lockedAt: '', lastError: '' } },
      { returnDocument: 'after' }
    );
    return result ? (fromMongo(result) as ContentSeedClient) : null;
  }
}
