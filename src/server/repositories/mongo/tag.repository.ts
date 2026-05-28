import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { Tag } from '@/types';
import type { CreateTagInput } from '@/schemas';

export class MongoTagRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('tags');
  }

  async findAll(): Promise<Tag[]> {
    const col = await this.col();
    const docs = await col.find({}).sort({ name: 1 }).toArray();
    return docs.map((d) => fromMongo(d) as unknown as Tag);
  }

  async findByIds(ids: string[]): Promise<Tag[]> {
    if (ids.length === 0) return [];
    const col = await this.col();
    const docs = await col.find({ id: { $in: ids } }).toArray();
    return docs.map((d) => fromMongo(d) as unknown as Tag);
  }

  async findById(id: string): Promise<Tag | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as Tag;
  }

  async create(data: CreateTagInput): Promise<Tag> {
    const col = await this.col();
    const id = generateId();
    const tag = {
      ...data,
      id,
      usageCount: 0,
      createdAt: nowIso(),
    };
    await col.insertOne(tag);
    return fromMongo(tag) as unknown as Tag;
  }

  async incrementUsage(id: string, delta = 1): Promise<void> {
    const col = await this.col();
    await col.updateOne({ id }, { $inc: { usageCount: delta } });
  }

  async mergeTags(sourceIds: string[], targetId: string): Promise<void> {
    const db = await getMongoDb();
    const tagCol = db.collection('tags');
    const mcqCol = db.collection('mcqs');

    for (const sourceId of sourceIds) {
      // Reassign MCQs: replace sourceId with targetId in tagIds array
      await mcqCol.updateMany(
        { tagIds: sourceId },
        { $addToSet: { tagIds: targetId } }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await mcqCol.updateMany({ tagIds: sourceId }, { $pull: { tagIds: sourceId } } as any);
      // Delete source tag
      await tagCol.deleteOne({ id: sourceId });
    }

    // Recount usage for target
    const count = await mcqCol.countDocuments({ tagIds: targetId });
    await tagCol.updateOne({ id: targetId }, { $set: { usageCount: count } });
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
