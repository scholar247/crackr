import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { AIFactoryLogEntry, AIFactoryLogEntryClient, AILogLevel, AILogPhase } from '@/types';

export interface CreateLogInput {
  runId: string;
  phase: AILogPhase;
  seedId?: string;
  examId?: string;
  subjectId?: string;
  topicId?: string;
  level: AILogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

export class MongoAILogRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('aiFactoryLogs');
  }

  async ensureIndexes(): Promise<void> {
    const col = await this.col();
    await Promise.all([
      col.createIndex({ runId: 1, createdAt: -1 }),
      col.createIndex({ seedId: 1, createdAt: -1 }),
      col.createIndex({ createdAt: -1 }),
    ]);
  }

  async insert(data: CreateLogInput): Promise<void> {
    const col = await this.col();
    const entry: AIFactoryLogEntry = { ...data, id: generateId(), createdAt: nowIso() };
    await col.insertOne(entry);
  }

  async listByRun(runId: string, limit = 200): Promise<AIFactoryLogEntryClient[]> {
    const col = await this.col();
    const docs = await col.find({ runId }).sort({ createdAt: 1 }).limit(limit).toArray();
    return docs.map((d) => fromMongo(d) as AIFactoryLogEntryClient);
  }

  async listBySeed(seedId: string, limit = 200): Promise<AIFactoryLogEntryClient[]> {
    const col = await this.col();
    const docs = await col.find({ seedId }).sort({ createdAt: 1 }).limit(limit).toArray();
    return docs.map((d) => fromMongo(d) as AIFactoryLogEntryClient);
  }
}
