import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { MCQClient } from '@/types';
import type { CreateMCQInput, UpdateMCQInput, MCQListQuery } from '@/schemas';
import type { MCQListResult } from '../mcq.repository';

// Import at call-time to avoid circular reference issues across backends
async function getTopicRepo() {
  const { topicRepository } = await import('../topic.repository');
  return topicRepository;
}

export class MongoMCQRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('mcqs');
  }

  async findById(id: string): Promise<MCQClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    if (!doc.creatorEmail) {
      // Fire-and-forget background update for legacy docs missing creatorEmail
      col.updateOne(
        { id },
        { $set: { creatorEmail: 'join.scholar247@gmail.com', status: 'PUBLISHED', isActive: true, updatedAt: nowIso() } }
      );
      doc.creatorEmail = 'join.scholar247@gmail.com';
      doc.status = 'PUBLISHED';
      doc.isActive = true;
    }
    return fromMongo(doc) as MCQClient;
  }

  async findByIds(ids: string[]): Promise<MCQClient[]> {
    if (ids.length === 0) return [];
    const col = await this.col();
    const docs = await col.find({ id: { $in: ids } }).toArray();
    return docs.map((d) => fromMongo(d) as MCQClient);
  }

  async list(query: MCQListQuery): Promise<MCQListResult> {
    const col = await this.col();
    const filter: Record<string, unknown> = {};

    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.topicId) filter.topicId = query.topicId;
    if (query.topicAncestorId && !query.topicId) filter.topicPath = query.topicAncestorId;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.questionType) filter.questionType = query.questionType;
    if (query.isPreviousYear !== undefined) filter.isPreviousYear = query.isPreviousYear;
    if (query.isVerified !== undefined) filter.isVerified = query.isVerified;
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.status) filter.status = query.status;

    if (query.examIds) {
      const examList = query.examIds.split(',').filter(Boolean);
      if (examList.length === 1) filter.examIds = examList[0];
      else if (examList.length > 1) filter.examIds = { $in: examList };
    }

    if (query.examSectionIds) {
      const sectionList = query.examSectionIds.split(',').filter(Boolean);
      if (sectionList.length === 1) filter.examSectionIds = sectionList[0];
    }

    if (query.tagIds) {
      const tagList = query.tagIds.split(',').filter(Boolean);
      if (tagList.length === 1) filter.tagIds = tagList[0];
      else if (tagList.length > 1) filter.$and = tagList.map((t) => ({ tagIds: t }));
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    if (query.pypId) {
      filter['pyps.pypId'] = query.pypId;
    }

    if (query.creatorEmail) {
      filter.creatorEmail = { $regex: query.creatorEmail, $options: 'i' };
    }

    const pageSize = query.pageSize ?? 20;
    const page = query.page ?? 1;
    const skip = (page - 1) * pageSize;

    const [total, docs] = await Promise.all([
      col.countDocuments(filter),
      col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
    ]);

    const items = docs.map((d) => fromMongo(d) as MCQClient);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(data: CreateMCQInput, createdBy: string, creatorEmail: string): Promise<MCQClient> {
    const col = await this.col();
    const topicRepo = await getTopicRepo();
    const topic = await topicRepo.findById(data.topicId);
    if (!topic) throw new Error('Topic not found');

    const topicPath = [...topic.path, topic.id];
    const topicPathNames = [...topic.pathNames, topic.name];

    const id = generateId();
    const now = nowIso();
    const mcq = {
      ...data,
      id,
      topicPath,
      topicPathNames,
      createdBy,
      creatorEmail,
      status: 'DRAFT' as const,
      isActive: false,
      isVerified: false,
      pyps: [],
      usageCount: 0,
      attemptCount: 0,
      correctCount: 0,
      accuracyRate: 0,
      avgTimeTakenSeconds: 0,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(mcq);
    await topicRepo.incrementMCQCount(data.topicId, 1);
    return fromMongo(mcq) as MCQClient;
  }

  async update(id: string, data: UpdateMCQInput): Promise<MCQClient | null> {
    const col = await this.col();
    const existing = await col.findOne({ id });
    if (!existing) return null;

    const updates: Record<string, unknown> = { ...data, updatedAt: nowIso() };

    if (data.status !== undefined) {
      updates.isActive = data.status === 'PUBLISHED';
    }

    if (data.topicId && data.topicId !== existing.topicId) {
      const topicRepo = await getTopicRepo();
      const topic = await topicRepo.findById(data.topicId);
      if (!topic) throw new Error('Topic not found');
      updates.topicPath = [...topic.path, topic.id];
      updates.topicPathNames = [...topic.pathNames, topic.name];

      if (existing.topicId) await topicRepo.incrementMCQCount(existing.topicId as string, -1);
      await topicRepo.incrementMCQCount(data.topicId, 1);
    }

    const result = await col.findOneAndUpdate({ id }, { $set: updates }, { returnDocument: 'after' });
    if (!result) return null;
    return fromMongo(result) as MCQClient;
  }

  async softDelete(id: string): Promise<boolean> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return false;

    await col.updateOne({ id }, { $set: { isActive: false, updatedAt: nowIso() } });

    if (doc.topicId) {
      const topicRepo = await getTopicRepo();
      await topicRepo.incrementMCQCount(doc.topicId as string, -1);
    }
    return true;
  }

  async randomSelect(opts: {
    subjectIds?: string[];
    topicIds?: string[];
    examId?: string;
    examSectionIds?: string[];
    tagIds?: string[];
    difficulty?: string;
    isPreviousYear?: boolean;
    count: number;
  }): Promise<string[]> {
    const col = await this.col();
    const filter: Record<string, unknown> = { isActive: true };

    if (opts.subjectIds && opts.subjectIds.length > 0) filter.subjectId = { $in: opts.subjectIds };
    if (opts.examId) filter.examIds = opts.examId;
    if (opts.topicIds && opts.topicIds.length > 0) {
      filter.topicPath = opts.topicIds.length === 1 ? opts.topicIds[0] : { $in: opts.topicIds };
    }
    if (opts.difficulty && opts.difficulty !== 'MIXED') filter.difficulty = opts.difficulty;
    if (opts.isPreviousYear !== undefined) filter.isPreviousYear = opts.isPreviousYear;
    if (opts.examSectionIds && opts.examSectionIds.length > 0) filter.examSectionIds = { $in: opts.examSectionIds };
    if (opts.tagIds && opts.tagIds.length > 0) filter.tagIds = { $in: opts.tagIds };

    // Use MongoDB $sample for random selection
    const docs = await col.aggregate([
      { $match: filter },
      { $sample: { size: opts.count } },
      { $project: { id: 1, _id: 0 } },
    ]).toArray();

    return docs.map((d) => d.id as string);
  }

  async incrementUsage(ids: string[]): Promise<void> {
    const col = await this.col();
    await col.updateMany({ id: { $in: ids } }, { $inc: { usageCount: 1 } });
  }

  async countMCQs(query: Partial<MCQListQuery>): Promise<number> {
    const col = await this.col();
    const filter: Record<string, unknown> = { isActive: true };

    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.topicId) filter.topicId = query.topicId;
    if (query.topicAncestorId && !query.topicId) filter.topicPath = query.topicAncestorId;
    if (query.examIds) {
      const examList = query.examIds.split(',').filter(Boolean);
      if (examList.length === 1) filter.examIds = examList[0];
    }
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.questionType) filter.questionType = query.questionType;
    if (query.isPreviousYear !== undefined) filter.isPreviousYear = query.isPreviousYear;

    return col.countDocuments(filter);
  }

  async recordAttempt(mcqId: string, isCorrect: boolean, timeTakenSeconds: number): Promise<void> {
    const col = await this.col();
    const doc = await col.findOne({ id: mcqId });
    if (!doc) return;

    const prevAttempts = (doc.attemptCount as number) ?? 0;
    const prevCorrect = (doc.correctCount as number) ?? 0;
    const prevAvgTime = (doc.avgTimeTakenSeconds as number) ?? 0;

    const newAttempts = prevAttempts + 1;
    const newCorrect = prevCorrect + (isCorrect ? 1 : 0);
    const newAvgTime = (prevAvgTime * prevAttempts + timeTakenSeconds) / newAttempts;
    const accuracyRate = newCorrect / newAttempts;

    await col.updateOne(
      { id: mcqId },
      { $set: { attemptCount: newAttempts, correctCount: newCorrect, avgTimeTakenSeconds: newAvgTime, accuracyRate, updatedAt: nowIso() } }
    );
  }
}
