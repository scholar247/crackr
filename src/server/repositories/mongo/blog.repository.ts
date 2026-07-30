import { getMongoDb } from '@/lib/mongodb';
import { generateId, fromMongo, nowIso } from './helpers';
import { slugify } from '@/lib/utils';
import type { BlogClient } from '@/types';
import type { CreateBlogInput, UpdateBlogInput, BlogListQuery } from '@/schemas/blog.schema';

export interface BlogListResult {
  items: BlogClient[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Estimate reading time from Markdown content: ~200 words per minute. */
function calcReadingTime(markdownContent: string): number {
  const text = (markdownContent ?? '')
    .replace(/```[\s\S]*?```/g, ' ')       // fenced code blocks
    .replace(/`[^`]*`/g, ' ')              // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> keep link text
    .replace(/^:::.*$/gm, ' ')             // callout fences
    .replace(/^#{1,6}\s+/gm, '')           // heading markers
    .replace(/^\s*>+\s?/gm, '')            // blockquote markers
    .replace(/^\s*[-*+]\s+/gm, '')         // bullet list markers
    .replace(/^\s*\d+\.\s+/gm, '')         // ordered list markers
    .replace(/[*_~#|]/g, ' ');             // remaining emphasis/table/heading chars
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export class MongoBlogRepository {
  private async col() {
    const db = await getMongoDb();
    return db.collection('blogs');
  }

  // ─── Ensure indexes (call once at startup or lazily) ──────────────────────
  async ensureIndexes(): Promise<void> {
    const col = await this.col();
    await Promise.all([
      col.createIndex({ slug: 1 }, { unique: true }),
      col.createIndex({ status: 1 }),
      col.createIndex({ type: 1 }),
      col.createIndex({ examIds: 1 }),
      col.createIndex({ subjectIds: 1 }),
      col.createIndex({ topicIds: 1 }),
      col.createIndex({ createdAt: -1 }),
      col.createIndex({ publishedAt: -1 }),
      col.createIndex({ viewCount: -1 }),
      col.createIndex({ 'slugHistory.slug': 1 }),
      col.createIndex({ title: 'text', summary: 'text' }),
    ]);
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async findById(id: string): Promise<BlogClient | null> {
    const col = await this.col();
    const doc = await col.findOne({ id });
    if (!doc) return null;
    return fromMongo(doc) as BlogClient;
  }

  async findBySlug(slug: string): Promise<BlogClient | null> {
    const col = await this.col();
    // Check current slug first, then slug history for redirects
    const doc = await col.findOne({ slug });
    if (doc) return fromMongo(doc) as BlogClient;
    // historical slug lookup
    const historical = await col.findOne({ 'slugHistory.slug': slug });
    if (historical) return fromMongo(historical) as BlogClient;
    return null;
  }

  async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    const col = await this.col();
    const filter: Record<string, unknown> = {
      $or: [{ slug }, { 'slugHistory.slug': slug }],
    };
    if (excludeId) filter.id = { $ne: excludeId };
    const count = await col.countDocuments(filter);
    return count > 0;
  }

  async list(query: BlogListQuery): Promise<BlogListResult> {
    const col = await this.col();
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;

    if (query.examIds) {
      const ids = query.examIds.split(',').filter(Boolean);
      if (ids.length === 1) filter.examIds = ids[0];
      else if (ids.length > 1) filter.examIds = { $in: ids };
    }
    if (query.subjectIds) {
      const ids = query.subjectIds.split(',').filter(Boolean);
      if (ids.length === 1) filter.subjectIds = ids[0];
      else if (ids.length > 1) filter.subjectIds = { $in: ids };
    }
    if (query.topicIds) {
      const ids = query.topicIds.split(',').filter(Boolean);
      if (ids.length === 1) filter.topicIds = ids[0];
      else if (ids.length > 1) filter.topicIds = { $in: ids };
    }
    if (query.creatorEmail) {
      filter.creatorEmail = { $regex: query.creatorEmail, $options: 'i' };
    }
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const pageSize = query.pageSize ?? 20;
    const page = query.page ?? 1;
    const skip = (page - 1) * pageSize;
    const sortDir = query.sortDir === 'asc' ? 1 : -1;

    const [total, docs] = await Promise.all([
      col.countDocuments(filter),
      col.find(filter)
        .sort({ [query.sortBy]: sortDir })
        .skip(skip)
        .limit(pageSize)
        .toArray(),
    ]);

    return {
      items: docs.map((d) => fromMongo(d) as BlogClient),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findPublished(query: BlogListQuery): Promise<BlogListResult> {
    return this.list({ ...query, status: 'PUBLISHED' });
  }

  /** Fetch slug + updatedAt for every published blog — used by sitemap only. */
  async findAllPublishedForSitemap(): Promise<{ slug: string; updatedAt: string }[]> {
    const col = await this.col();
    const docs = await col
      .find({ status: 'PUBLISHED' }, { projection: { _id: 0, slug: 1, updatedAt: 1 } })
      .sort({ publishedAt: -1 })
      .toArray();
    return docs.map((d) => ({ slug: d.slug as string, updatedAt: d.updatedAt as string }));
  }

  // ─── Mutations ────────────────────────────────────────────────────────────

  async create(data: CreateBlogInput, createdBy: string, creatorEmail: string): Promise<BlogClient> {
    const col = await this.col();
    const id = generateId();
    const now = nowIso();

    let slug = data.slug ?? slugify(data.title);
    if (await this.isSlugTaken(slug)) {
      slug = `${slug}-${id.slice(0, 8)}`;
    }

    const readingTimeMinutes = calcReadingTime(data.content ?? '');

    const doc = {
      ...data,
      id,
      slug,
      slugHistory: [],
      readingTimeMinutes,
      viewCount: 0,
      isActive: data.status === 'PUBLISHED',
      publishedAt: data.status === 'PUBLISHED' ? now : undefined,
      archivedAt: undefined,
      createdBy,
      creatorEmail,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(doc);
    return fromMongo(doc) as BlogClient;
  }

  async update(id: string, data: UpdateBlogInput): Promise<BlogClient | null> {
    const col = await this.col();
    const existing = await col.findOne({ id });
    if (!existing) return null;

    const updates: Record<string, unknown> = { ...data, updatedAt: nowIso() };

    // Slug change → push old slug to history
    if (data.slug && data.slug !== existing.slug) {
      const taken = await this.isSlugTaken(data.slug, id);
      if (taken) throw new Error(`Slug "${data.slug}" is already in use`);
      const entry = { slug: existing.slug as string, replacedAt: nowIso() };
      updates.$push = { slugHistory: entry };
      delete updates.slugHistory; // avoid overwrite
    }

    // Reading time update when content changes
    if (data.content) {
      updates.readingTimeMinutes = calcReadingTime(data.content);
    }

    // Status transitions
    if (data.status !== undefined) {
      updates.isActive = data.status === 'PUBLISHED';
      if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
        updates.publishedAt = nowIso();
      }
      if (data.status === 'ARCHIVED') {
        updates.archivedAt = nowIso();
      }
    }

    const result = await col.findOneAndUpdate({ id }, { $set: updates }, { returnDocument: 'after' });
    if (!result) return null;
    return fromMongo(result) as BlogClient;
  }

  async softDelete(id: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.updateOne(
      { id },
      { $set: { status: 'ARCHIVED', isActive: false, archivedAt: nowIso(), updatedAt: nowIso() } }
    );
    return result.modifiedCount > 0;
  }

  async incrementViewCount(id: string): Promise<void> {
    const col = await this.col();
    await col.updateOne({ id }, { $inc: { viewCount: 1 } });
  }

  async findRelated(blogId: string, relatedBlogIds: string[]): Promise<BlogClient[]> {
    if (relatedBlogIds.length === 0) return [];
    const col = await this.col();
    const docs = await col
      .find({ id: { $in: relatedBlogIds }, status: 'PUBLISHED' })
      .toArray();
    return docs.map((d) => fromMongo(d) as BlogClient);
  }
}
