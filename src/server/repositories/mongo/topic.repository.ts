import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import { slugify } from '@/lib/utils';
import type { TopicClient, TopicTreeNode } from '@/types';
import type { CreateTopicInput, UpdateTopicInput } from '@/schemas';

export class MongoTopicRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('topics');
  }

  async findById(id: string): Promise<TopicClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as TopicClient;
  }

  async getRootTopics(subjectId: string): Promise<TopicClient[]> {
    const col = await this.col();
    const docs = await col.find({ subjectId, parentId: null, isActive: true }).toArray();
    return docs
      .map((d) => fromMongo(d) as TopicClient)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }

  async getChildTopics(parentId: string): Promise<TopicClient[]> {
    const col = await this.col();
    const docs = await col.find({ parentId, isActive: true }).toArray();
    return docs
      .map((d) => fromMongo(d) as TopicClient)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }

  async findAllBySubject(subjectId: string, activeOnly = true): Promise<TopicClient[]> {
    const col = await this.col();
    const filter = activeOnly ? { subjectId, isActive: true } : { subjectId };
    const docs = await col.find(filter).toArray();
    return docs
      .map((d) => fromMongo(d) as TopicClient)
      .sort((a, b) => a.depth - b.depth || a.order - b.order || a.name.localeCompare(b.name));
  }

  async getTopicTree(subjectId: string): Promise<TopicTreeNode[]> {
    const all = await this.findAllBySubject(subjectId);
    const byId: Record<string, TopicTreeNode> = {};
    const roots: TopicTreeNode[] = [];

    for (const topic of all) {
      byId[topic.id] = { ...topic, children: [] };
    }
    for (const topic of all) {
      if (topic.parentId && byId[topic.parentId]) {
        byId[topic.parentId].children.push(byId[topic.id]);
      } else if (!topic.parentId) {
        roots.push(byId[topic.id]);
      }
    }
    return roots;
  }

  async getDescendants(topicId: string): Promise<TopicClient[]> {
    const col = await this.col();
    const docs = await col.find({ path: topicId }).toArray();
    return docs.map((d) => fromMongo(d) as TopicClient);
  }

  async getBreadcrumb(topicId: string): Promise<{ id: string; name: string }[]> {
    const topic = await this.findById(topicId);
    if (!topic) return [];
    const crumbs = topic.path.map((id, i) => ({ id, name: topic.pathNames[i] ?? id }));
    crumbs.push({ id: topic.id, name: topic.name });
    return crumbs;
  }

  async create(data: CreateTopicInput): Promise<TopicClient> {
    const col = await this.col();

    let depth = 0;
    let path: string[] = [];
    let pathNames: string[] = [];

    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      if (!parent) throw new Error('Parent topic not found');
      depth = parent.depth + 1;
      if (depth > 3) throw new Error('Maximum topic depth (3) exceeded');
      path = [...parent.path, parent.id];
      pathNames = [...parent.pathNames, parent.name];
    }

    const id = generateId();
    const now = nowIso();
    const topic = {
      id,
      name: data.name,
      slug: slugify(data.name),
      subjectId: data.subjectId,
      parentId: data.parentId ?? null,
      depth,
      path,
      pathNames,
      order: data.order ?? 0,
      description: data.description,
      isActive: true,
      mcqCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(topic);
    await this._incrementSubjectTopicCount(data.subjectId, 1);
    return fromMongo(topic) as TopicClient;
  }

  async update(id: string, data: UpdateTopicInput): Promise<TopicClient | null> {
    const col = await this.col();
    const updates: Record<string, unknown> = { ...data, updatedAt: nowIso() };
    if (data.name) updates.slug = slugify(data.name);

    const result = await col.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result) return null;
    return fromMongo(result) as TopicClient;
  }

  async moveTopic(topicId: string, newParentId: string | null): Promise<void> {
    const col = await this.col();
    const topic = await this.findById(topicId);
    if (!topic) throw new Error('Topic not found');

    let newDepth = 0;
    let newPath: string[] = [];
    let newPathNames: string[] = [];

    if (newParentId) {
      const newParent = await this.findById(newParentId);
      if (!newParent) throw new Error('New parent topic not found');
      newDepth = newParent.depth + 1;
      if (newDepth > 3) throw new Error('Maximum topic depth (3) exceeded');
      newPath = [...newParent.path, newParentId];
      newPathNames = [...newParent.pathNames, newParent.name];
    }

    const descendants = await this.getDescendants(topicId);
    const now = nowIso();

    // Update the topic itself
    await col.updateOne(
      { id: topicId },
      { $set: { parentId: newParentId, depth: newDepth, path: newPath, pathNames: newPathNames, updatedAt: now } }
    );

    // Update all descendants
    for (const desc of descendants) {
      const idx = desc.path.indexOf(topicId);
      if (idx === -1) continue;
      const suffix = desc.path.slice(idx + 1);
      const suffixNames = desc.pathNames.slice(idx + 1);
      const updatedPath = [...newPath, topicId, ...suffix];
      const updatedPathNames = [...newPathNames, topic.name, ...suffixNames];
      await col.updateOne(
        { id: desc.id },
        { $set: { depth: newDepth + 1 + suffix.length, path: updatedPath, pathNames: updatedPathNames, updatedAt: now } }
      );
    }
  }

  async softDelete(id: string): Promise<void> {
    const topic = await this.findById(id);
    if (!topic) throw new Error('Topic not found');
    if (topic.mcqCount > 0) throw new Error(`Cannot delete topic with ${topic.mcqCount} MCQs`);

    const col = await this.col();
    await col.updateOne({ id }, { $set: { isActive: false, updatedAt: nowIso() } });
    await this._incrementSubjectTopicCount(topic.subjectId, -1);
  }

  /** Dedup check for seeding — unique key is (slug, subjectId, parentId) */
  async findBySlugInSubject(slug: string, subjectId: string, parentId: string | null): Promise<TopicClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ slug, subjectId, parentId: parentId ?? null });
    if (!doc) return null;
    return fromMongo(doc) as TopicClient;
  }

  async getTopicsByIds(ids: string[]): Promise<TopicClient[]> {
    if (ids.length === 0) return [];
    const col = await this.col();
    const docs = await col.find({ id: { $in: ids } }).toArray();
    return docs.map((d) => fromMongo(d) as TopicClient);
  }

  async incrementMCQCount(topicId: string, delta: number): Promise<void> {
    const col = await this.col();
    await col.updateOne({ id: topicId }, { $inc: { mcqCount: delta } });
  }

  private async _incrementSubjectTopicCount(subjectId: string, delta: number): Promise<void> {
    const db = await getMongoDb();
    await db.collection('subjects').updateOne({ id: subjectId }, { $inc: { topicCount: delta } });
  }
}
