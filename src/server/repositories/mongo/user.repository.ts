import { getMongoDb } from '@/lib/mongodb';
import { fromMongo, nowIso } from './helpers';
import type { UserClient, UserRole, UserProfile } from '@/types';
import { DEFAULT_PROFILE } from '@/types';
import type { UpdateProfileInput } from '@/schemas/profile.schema';

export class MongoUserRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('users');
  }

  async findById(id: string): Promise<UserClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as UserClient;
  }

  async findByEmail(email: string): Promise<UserClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ email });
    if (!doc) return null;
    return fromMongo(doc) as UserClient;
  }

  async findAll(opts?: { page?: number; pageSize?: number; search?: string }): Promise<{ items: UserClient[]; total: number }> {
    const col = await this.col();
    const pageSize = opts?.pageSize ?? 20;
    const page = opts?.page ?? 1;
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    if (opts?.search) {
      filter.$or = [
        { name: { $regex: opts.search, $options: 'i' } },
        { email: { $regex: opts.search, $options: 'i' } },
      ];
    }

    const [total, docs] = await Promise.all([
      col.countDocuments(filter),
      col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
    ]);

    return {
      items: docs.map((d) => fromMongo(d) as UserClient),
      total,
    };
  }

  async findByRole(role: UserRole): Promise<UserClient[]> {
    const col = await this.col();
    const docs = await col.find({ role }).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => fromMongo(d) as UserClient);
  }

  async findByIds(ids: string[]): Promise<UserClient[]> {
    if (ids.length === 0) return [];
    const col = await this.col();
    const docs = await col.find({ id: { $in: ids } }).toArray();
    return docs.map((d) => fromMongo(d) as UserClient);
  }

  async updateRole(id: string, role: UserRole): Promise<boolean> {
    const col = await this.col();
    const result = await col.updateOne({ id }, { $set: { role, updatedAt: nowIso() } });
    return result.matchedCount > 0;
  }

  async updateDetails(id: string, details: { name?: string; role?: UserRole }): Promise<boolean> {
    const col = await this.col();
    const patch: Record<string, unknown> = { updatedAt: nowIso() };
    if (details.name !== undefined) patch.name = details.name;
    if (details.role !== undefined) patch.role = details.role;
    const result = await col.updateOne({ id }, { $set: patch });
    return result.matchedCount > 0;
  }

  async updateGroups(id: string, groupIds: string[]): Promise<boolean> {
    const col = await this.col();
    const result = await col.updateOne({ id }, { $set: { groupIds, updatedAt: nowIso() } });
    return result.matchedCount > 0;
  }

  async ensureProfile(id: string): Promise<void> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc || doc.profile) return;
    await col.updateOne({ id }, { $set: { profile: DEFAULT_PROFILE, updatedAt: nowIso() } });
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<UserClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;

    const currentProfile: UserProfile = (doc.profile as UserProfile) ?? DEFAULT_PROFILE;
    const updated: UserProfile = {
      ...currentProfile,
      targetExamIds: input.targetExamIds,
      primaryExamId: input.primaryExamId,
      preparationLevel: input.preparationLevel,
      targetYear: input.targetYear,
      preferredDifficulty: input.preferredDifficulty,
      dailyGoalQuestions: input.dailyGoalQuestions,
    };

    const result = await col.findOneAndUpdate(
      { id },
      { $set: { profile: updated, updatedAt: nowIso() } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as UserClient;
  }

  async patchProfile(id: string, patch: Partial<UserProfile>): Promise<void> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return;
    const current: UserProfile = (doc.profile as UserProfile) ?? DEFAULT_PROFILE;
    const merged = { ...current, ...patch };
    await col.updateOne({ id }, { $set: { profile: merged, updatedAt: nowIso() } });
  }
}
