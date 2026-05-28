import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { Group } from '@/types';
import type { CreateGroupInput } from '@/schemas';

type UpdateGroupInput = Partial<CreateGroupInput>;

export class MongoGroupRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('groups');
  }

  async findAll(): Promise<Group[]> {
    const col = await this.col();
    const docs = await col.find({}).sort({ name: 1 }).toArray();
    return docs.map((d) => fromMongo(d) as Group);
  }

  async findById(id: string): Promise<Group | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as Group;
  }

  async create(data: CreateGroupInput, createdBy: string): Promise<Group> {
    const col = await this.col();
    const id = generateId();
    const group = { ...data, id, createdBy, createdAt: nowIso() };
    await col.insertOne(group);
    return fromMongo(group) as unknown as Group;
  }

  async update(id: string, data: UpdateGroupInput): Promise<Group | null> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as Group;
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
