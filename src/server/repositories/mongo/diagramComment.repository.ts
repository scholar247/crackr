import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import type { DiagramCommentClient, DiagramCommentReply } from '@/types/interview.types';
import type { CreateDiagramCommentInput } from '@/schemas/interview.schema';

interface DiagramCommentDoc {
  id: string;
  diagramId: string;
  authorId: string;
  text: string;
  resolved: boolean;
  replies: DiagramCommentReply[];
  createdAt: string;
  updatedAt: string;
}

export class MongoDiagramCommentRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection<DiagramCommentDoc>('diagramComments');
  }

  async findById(id: string): Promise<DiagramCommentClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as DiagramCommentClient;
  }

  async findByDiagram(diagramId: string): Promise<DiagramCommentClient[]> {
    const col = await this.col();
    const docs = await col.find({ diagramId }).sort({ createdAt: 1 }).toArray();
    return docs.map((d) => fromMongo(d) as DiagramCommentClient);
  }

  async create(diagramId: string, data: CreateDiagramCommentInput, authorId: string): Promise<DiagramCommentClient> {
    const col = await this.col();
    const now = nowIso();
    const comment = {
      id: generateId(),
      diagramId,
      authorId,
      text: data.text,
      resolved: false,
      replies: [],
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(comment);
    return fromMongo(comment) as DiagramCommentClient;
  }

  async addReply(commentId: string, text: string, authorId: string): Promise<DiagramCommentClient | null> {
    const col = await this.col();
    const reply = { id: generateId(), authorId, text, createdAt: nowIso() };
    const result = await col.findOneAndUpdate(
      { id: commentId },
      { $push: { replies: reply }, $set: { updatedAt: nowIso() } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as DiagramCommentClient;
  }

  async setResolved(commentId: string, resolved: boolean): Promise<DiagramCommentClient | null> {
    const col = await this.col();
    const result = await col.findOneAndUpdate(
      { id: commentId },
      { $set: { resolved, updatedAt: nowIso() } },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as DiagramCommentClient;
  }
}
