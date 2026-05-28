import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { SubjectClient } from '@/types';
import type { CreateSubjectInput, UpdateSubjectInput } from '@/schemas';

export class MongoSubjectRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('subjects');
  }

  async findAll(activeOnly = true): Promise<SubjectClient[]> {
    const col = await this.col();
    const docs = await col.find(activeOnly ? { isActive: true } : {}).toArray();
    return docs
      .map((d) => fromMongo(d) as SubjectClient)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<SubjectClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as SubjectClient;
  }

  async findBySlug(slug: string): Promise<SubjectClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ slug });
    if (!doc) return null;
    return fromMongo(doc) as SubjectClient;
  }

  async create(data: CreateSubjectInput): Promise<SubjectClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const subject = { ...data, id, createdAt: now, updatedAt: now };
    await col.insertOne(subject);
    return fromMongo(subject) as SubjectClient;
  }

  async update(id: string, data: UpdateSubjectInput): Promise<SubjectClient | null> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { id },
      { $set: { ...data, updatedAt: nowIso() } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as SubjectClient;
  }

  async getSubjectsByIds(ids: string[]): Promise<SubjectClient[]> {
    if (ids.length === 0) return [];
    const col = await this.col();
    const docs = await col.find({ id: { $in: ids }, isActive: true }).toArray();
    return docs.map((d) => fromMongo(d) as SubjectClient);
  }

  async softDelete(id: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.updateOne({ id }, { $set: { isActive: false, updatedAt: nowIso() } });
    return result.matchedCount > 0;
  }
}
