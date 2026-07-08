import { blogRepository } from '@/server/repositories/blog.repository';
import type { CreateBlogInput, UpdateBlogInput, BlogListQuery } from '@/schemas/blog.schema';
import type { BlogClient } from '@/types';

export const blogService = {
  async list(query: BlogListQuery) {
    return blogRepository.list(query);
  },

  async listPublished(query: BlogListQuery) {
    return blogRepository.findPublished(query);
  },

  async getById(id: string): Promise<BlogClient | null> {
    return blogRepository.findById(id);
  },

  async getBySlug(slug: string, incrementView = false): Promise<BlogClient | null> {
    const blog = await blogRepository.findBySlug(slug);
    if (blog && incrementView) {
      // fire-and-forget
      blogRepository.incrementViewCount(blog.id).catch(() => {});
    }
    return blog;
  },

  async create(data: CreateBlogInput, userId: string, userEmail: string): Promise<BlogClient> {
    return blogRepository.create(data, userId, userEmail);
  },

  async update(id: string, data: UpdateBlogInput): Promise<BlogClient | null> {
    return blogRepository.update(id, data);
  },

  async delete(id: string): Promise<boolean> {
    return blogRepository.softDelete(id);
  },

  async getRelated(blog: BlogClient): Promise<BlogClient[]> {
    return blogRepository.findRelated(blog.id, blog.relatedBlogIds);
  },

  async ensureIndexes(): Promise<void> {
    return blogRepository.ensureIndexes();
  },
};
