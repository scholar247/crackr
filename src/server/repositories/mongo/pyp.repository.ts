import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import { slugify } from '@/lib/utils';
import type { PYPClient } from '@/types';
import type { CreatePYPInput, UpdatePYPInput } from '@/schemas';

const MONTH_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export class MongoPYPRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('pyps');
  }

  async findById(id: string): Promise<PYPClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as PYPClient;
  }

  async findBySlug(slug: string): Promise<PYPClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ slug });
    if (!doc) return null;
    return fromMongo(doc) as PYPClient;
  }

  async findAll(activeOnly = true): Promise<PYPClient[]> {
    const col = await this.col();
    const docs = await col.find(activeOnly ? { isActive: true } : {}).toArray();
    return docs
      .map((d) => fromMongo(d) as PYPClient)
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }

  /** Dedup check — (examId, year, month) should be unique */
  async findByExamYearMonth(examId: string, year: number, month: number): Promise<PYPClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ examId, year, month });
    if (!doc) return null;
    return fromMongo(doc) as PYPClient;
  }

  async findByExam(examId: string, activeOnly = true): Promise<PYPClient[]> {
    const col = await this.col();
    const filter = activeOnly ? { examId, isActive: true } : { examId };
    const docs = await col.find(filter).toArray();
    return docs
      .map((d) => fromMongo(d) as PYPClient)
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }

  async create(data: CreatePYPInput, examName: string, examSlug: string): Promise<PYPClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const slug =
      data.slug ??
      slugify(`${examSlug} ${data.year} ${MONTH_SHORT[data.month - 1]}`);

    const pyp = {
      ...data,
      id,
      examName,
      examSlug,
      slug,
      mcqIds: [] as string[],
      mcqCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(pyp);
    return fromMongo(pyp) as PYPClient;
  }

  async update(id: string, data: UpdatePYPInput): Promise<PYPClient | null> {
    const col = await this.col();
    const updates: Record<string, unknown> = { ...data, updatedAt: nowIso() };
    const result = await col.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as PYPClient;
  }

  async softDelete(id: string): Promise<void> {
    const col = await this.col();
    await col.updateOne({ id }, { $set: { isActive: false, updatedAt: nowIso() } });
  }

  async addMCQs(pypId: string, mcqIds: string[], pypTitle: string): Promise<PYPClient | null> {
    const db = await getMongoDb();
    const col = db.collection('pyps');
    const mcqCol = db.collection('mcqs');

    await col.updateOne(
      { id: pypId },
      { $addToSet: { mcqIds: { $each: mcqIds } }, $set: { updatedAt: nowIso() } }
    );

    const updated = await col.findOne({ id: pypId });
    if (!updated) return null;

    const mcqCount = (updated.mcqIds as string[]).length;
    await col.updateOne({ id: pypId }, { $set: { mcqCount } });

    // Add PYP reference to each MCQ (skip if already present)
    await mcqCol.updateMany(
      { id: { $in: mcqIds }, 'pyps.pypId': { $ne: pypId } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $push: { pyps: { pypId, pypTitle } } } as any
    );

    return fromMongo({ ...updated, mcqCount }) as PYPClient;
  }

  async removeMCQ(pypId: string, mcqId: string): Promise<PYPClient | null> {
    const db = await getMongoDb();
    const col = db.collection('pyps');
    const mcqCol = db.collection('mcqs');

    await col.updateOne(
      { id: pypId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $pull: { mcqIds: mcqId } as any, $set: { updatedAt: nowIso() } }
    );

    const updated = await col.findOne({ id: pypId });
    if (!updated) return null;

    const mcqCount = (updated.mcqIds as string[]).length;
    await col.updateOne({ id: pypId }, { $set: { mcqCount } });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await mcqCol.updateOne({ id: mcqId }, { $pull: { pyps: { pypId } } as any });

    return fromMongo({ ...updated, mcqCount }) as PYPClient;
  }
}
