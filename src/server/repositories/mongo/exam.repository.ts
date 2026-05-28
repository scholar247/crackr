import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import { slugify } from '@/lib/utils';
import type { ExamClient, ExamSectionClient } from '@/types';
import type { CreateExamInput, UpdateExamInput, CreateExamSectionInput, UpdateExamSectionInput } from '@/schemas';

export class MongoExamRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('exams');
  }

  private async sectionsCol() {
    const db = await getMongoDb();
    return db.collection('examSections');
  }

  // ─── Exam CRUD ───────────────────────────────────────────────────────────────

  async findById(id: string): Promise<ExamClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as ExamClient;
  }

  async findBySlug(slug: string): Promise<ExamClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ slug });
    if (!doc) return null;
    return fromMongo(doc) as ExamClient;
  }

  async findAll(activeOnly = true): Promise<ExamClient[]> {
    const col = await this.col();
    const docs = await col.find(activeOnly ? { isActive: true } : {}).toArray();
    return docs
      .map((d) => fromMongo(d) as ExamClient)
      .sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }

  async findByCategory(category: string, activeOnly = true): Promise<ExamClient[]> {
    const col = await this.col();
    const filter = activeOnly ? { category, isActive: true } : { category };
    const docs = await col.find(filter).toArray();
    return docs
      .map((d) => fromMongo(d) as ExamClient)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findBySubject(subjectId: string): Promise<ExamClient[]> {
    const col = await this.col();
    const docs = await col.find({ subjectIds: subjectId, isActive: true }).toArray();
    return docs
      .map((d) => fromMongo(d) as ExamClient)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(data: CreateExamInput): Promise<ExamClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const exam = {
      ...data,
      id,
      slug: data.slug ?? slugify(data.name),
      mcqCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(exam);
    return fromMongo(exam) as ExamClient;
  }

  async update(id: string, data: UpdateExamInput): Promise<ExamClient | null> {
    const col = await this.col();
    const updates: Record<string, unknown> = { ...data, updatedAt: nowIso() };
    if (data.name && !data.slug) updates.slug = slugify(data.name);

    const result = await col.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as ExamClient;
  }

  async softDelete(id: string): Promise<void> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) throw new Error('Exam not found');
    await col.updateOne({ id }, { $set: { isActive: false, updatedAt: nowIso() } });
  }

  async incrementMCQCount(examId: string, delta: number): Promise<void> {
    const col = await this.col();
    await col.updateOne({ id: examId }, { $inc: { mcqCount: delta } });
  }

  async getExamsByIds(ids: string[]): Promise<ExamClient[]> {
    if (ids.length === 0) return [];
    const col = await this.col();
    const docs = await col.find({ id: { $in: ids } }).toArray();
    return docs.map((d) => fromMongo(d) as ExamClient);
  }

  // ─── Exam Sections ───────────────────────────────────────────────────────────

  async findSectionById(id: string): Promise<ExamSectionClient | null> {
    const col = await this.sectionsCol();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as ExamSectionClient;
  }

  async getSectionsByExam(examId: string, subjectId?: string): Promise<ExamSectionClient[]> {
    const col = await this.sectionsCol();
    const filter: Record<string, unknown> = { examId, isActive: true };
    if (subjectId) filter.subjectId = subjectId;
    const docs = await col.find(filter).toArray();
    return docs
      .map((d) => fromMongo(d) as ExamSectionClient)
      .sort((a, b) => a.order - b.order);
  }

  async getSectionsByTopic(topicId: string): Promise<ExamSectionClient[]> {
    const col = await this.sectionsCol();
    const docs = await col.find({ topicId, isActive: true }).toArray();
    return docs.map((d) => fromMongo(d) as ExamSectionClient);
  }

  async createSection(data: CreateExamSectionInput): Promise<ExamSectionClient> {
    const col = await this.sectionsCol();
    const id = generateId();
    const section = { ...data, id };
    await col.insertOne(section);
    return fromMongo(section) as ExamSectionClient;
  }

  async updateSection(id: string, data: UpdateExamSectionInput): Promise<ExamSectionClient | null> {
    const col = await this.sectionsCol();
    const result = await col.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as ExamSectionClient;
  }

  async deleteSection(id: string): Promise<void> {
    const col = await this.sectionsCol();
    await col.deleteOne({ id });
  }

  async reorderSections(examId: string, orderedIds: string[]): Promise<void> {
    const col = await this.sectionsCol();
    await Promise.all(
      orderedIds.map((id, index) => col.updateOne({ id }, { $set: { order: index } }))
    );
  }

  async getSectionsByExamIds(examIds: string[]): Promise<ExamSectionClient[]> {
    if (examIds.length === 0) return [];
    const col = await this.sectionsCol();
    const docs = await col.find({ examId: { $in: examIds }, isActive: true }).toArray();
    return docs.map((d) => fromMongo(d) as ExamSectionClient);
  }

  async getSections(filters: { examId: string; subjectId?: string; isActive?: boolean }): Promise<ExamSectionClient[]> {
    const col = await this.sectionsCol();
    const filter: Record<string, unknown> = { examId: filters.examId };
    if (filters.subjectId) filter.subjectId = filters.subjectId;
    if (filters.isActive !== undefined) filter.isActive = filters.isActive;
    const docs = await col.find(filter).toArray();
    return docs.map((d) => fromMongo(d) as ExamSectionClient);
  }

  async getSectionCoverage(examId: string): Promise<{ sectionId: string; mcqCount: number }[]> {
    const sections = await this.getSectionsByExam(examId);
    const db = await getMongoDb();
    const mcqCol = db.collection('mcqs');
    const results: { sectionId: string; mcqCount: number }[] = [];

    for (const section of sections) {
      const count = await mcqCol.countDocuments({ examSectionIds: section.id, isActive: true });
      results.push({ sectionId: section.id, mcqCount: count });
    }
    return results;
  }
}
