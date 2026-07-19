import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { DiagramVersionClient } from '@/types/interview.types';
import type { CreateDiagramVersionInput } from '@/schemas/interview.schema';

export class MongoDiagramVersionRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('diagramVersions');
  }

  async findById(id: string): Promise<DiagramVersionClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as DiagramVersionClient;
  }

  async findByDiagram(diagramId: string): Promise<DiagramVersionClient[]> {
    const col = await this.col();
    const docs = await col.find({ diagramId }).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => fromMongo(d) as DiagramVersionClient);
  }

  async create(diagramId: string, data: CreateDiagramVersionInput, createdBy: string): Promise<DiagramVersionClient> {
    const col = await this.col();
    const version = {
      id: generateId(),
      diagramId,
      content: data.content,
      label: data.label,
      createdBy,
      createdAt: nowIso(),
    };
    await col.insertOne(version);
    return fromMongo(version) as DiagramVersionClient;
  }
}
