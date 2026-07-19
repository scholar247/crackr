import { MongoServerError } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { DiagramClient, DiagramContent } from '@/types/interview.types';
import type { CreateDiagramInput, UpdateDiagramInput } from '@/schemas/interview.schema';

const DUPLICATE_KEY_ERROR = 11000;

function defaultContent(): DiagramContent {
  return {
    metadata: { schemaVersion: 1 },
    viewport: { x: 0, y: 0, zoom: 1 },
    layers: [{ id: generateId(), name: 'Layer 1', order: 0, visible: true, locked: false }],
    shapes: [],
    comments: [],
  };
}

export class MongoDiagramRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('diagrams');
  }

  async findById(id: string): Promise<DiagramClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as DiagramClient;
  }

  async findByIds(ids: string[]): Promise<DiagramClient[]> {
    if (ids.length === 0) return [];
    const col = await this.col();
    const docs = await col.find({ id: { $in: ids } }).sort({ updatedAt: -1 }).toArray();
    return docs.map((d) => fromMongo(d) as DiagramClient);
  }

  async findByOwner(ownerId: string): Promise<DiagramClient[]> {
    const col = await this.col();
    const docs = await col.find({ ownerId }).sort({ updatedAt: -1 }).toArray();
    return docs.map((d) => fromMongo(d) as DiagramClient);
  }

  async create(data: CreateDiagramInput, ownerId: string): Promise<DiagramClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();
    const diagram = {
      id,
      title: data.title,
      ownerId,
      visibility: data.visibility,
      content: defaultContent(),
      createdBy: ownerId,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(diagram);
    return fromMongo(diagram) as DiagramClient;
  }

  /**
   * Fetch the diagram at `id`, creating it (public, empty) on first visit if
   * it doesn't exist yet — this is what makes a freshly-minted URL like
   * `/interview/live/<uuid>` work as a shareable room without a separate
   * "create diagram" step. `id` is caller-supplied (not `generateId()`-ed
   * here), so a duplicate-key race is possible if two people open the same
   * brand-new link at once — the loser of that race just re-reads what the
   * winner inserted instead of erroring.
   */
  async getOrCreate(id: string, ownerId: string): Promise<DiagramClient> {
    const col = await this.col();
    const existing = await col.findOne({ id });
    if (existing) return fromMongo(existing) as DiagramClient;

    const now = nowIso();
    const diagram = {
      id,
      title: 'Untitled diagram',
      ownerId,
      visibility: 'PUBLIC' as const,
      content: defaultContent(),
      createdBy: ownerId,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await col.insertOne(diagram);
      return fromMongo(diagram) as DiagramClient;
    } catch (err) {
      if (err instanceof MongoServerError && err.code === DUPLICATE_KEY_ERROR) {
        const doc = await col.findOne({ id });
        if (doc) return fromMongo(doc) as DiagramClient;
      }
      throw err;
    }
  }

  async update(id: string, data: UpdateDiagramInput, editedBy: string): Promise<DiagramClient | null> {
    const col = await this.col();
    const updates: Record<string, unknown> = { ...data, updatedAt: nowIso() };
    if (data.content) {
      updates.lastEditedBy = editedBy;
      updates.lastEditedAt = nowIso();
    }
    const result = await col.findOneAndUpdate({ id }, { $set: updates }, { returnDocument: 'after' });
    if (!result) return null;
    return fromMongo(result) as DiagramClient;
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
