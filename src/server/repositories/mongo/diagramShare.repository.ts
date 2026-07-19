import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { DiagramShareClient } from '@/types/interview.types';
import type { CreateDiagramShareInput } from '@/schemas/interview.schema';

export class MongoDiagramShareRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('diagramShares');
  }

  async findByDiagram(diagramId: string): Promise<DiagramShareClient[]> {
    const col = await this.col();
    const docs = await col.find({ diagramId }).toArray();
    return docs.map((d) => fromMongo(d) as DiagramShareClient);
  }

  async findByDiagramAndUser(diagramId: string, userId: string): Promise<DiagramShareClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ diagramId, userId });
    if (!doc) return null;
    return fromMongo(doc) as DiagramShareClient;
  }

  async findByUser(userId: string): Promise<DiagramShareClient[]> {
    const col = await this.col();
    const docs = await col.find({ userId }).toArray();
    return docs.map((d) => fromMongo(d) as DiagramShareClient);
  }

  /** Invite, or change role if this user is already shared on the diagram. */
  async upsert(diagramId: string, data: CreateDiagramShareInput, invitedBy: string): Promise<DiagramShareClient> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { diagramId, userId: data.userId },
      {
        $set: { role: data.role },
        $setOnInsert: {
          id: generateId(),
          diagramId,
          userId: data.userId,
          invitedBy,
          createdAt: nowIso(),
        },
      },
      { returnDocument: 'after', upsert: true }
    );
    return fromMongo(result!) as DiagramShareClient;
  }

  async remove(diagramId: string, userId: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.deleteOne({ diagramId, userId });
    return result.deletedCount > 0;
  }
}
