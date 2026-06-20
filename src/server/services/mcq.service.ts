import { mcqRepository } from '@/server/repositories/mcq.repository';
import { tagRepository } from '@/server/repositories/tag.repository';
import type { CreateMCQInput, UpdateMCQInput, MCQListQuery } from '@/schemas';
import type { MCQClient } from '@/types';

export const mcqService = {
  async list(query: MCQListQuery) {
    return mcqRepository.list(query);
  },

  async getById(id: string): Promise<MCQClient | null> {
    return mcqRepository.findById(id);
  },

  async create(data: CreateMCQInput, userId: string, userEmail?: string): Promise<MCQClient> {
    const creatorEmail = userEmail ?? 'join.scholar@gmail.com';
    const mcq = await mcqRepository.create(data, userId, creatorEmail);

    // Increment usage counts for all tags
    if (data.tagIds.length > 0) {
      await Promise.all(data.tagIds.map((id) => tagRepository.incrementUsage(id)));
    }

    return mcq;
  },

  async update(id: string, data: UpdateMCQInput, userId: string): Promise<MCQClient | null> {
    const existing = await mcqRepository.findById(id);
    if (!existing) return null;

    const mcq = await mcqRepository.update(id, data);

    // Handle tag usage count changes
    if (data.tagIds) {
      const added = data.tagIds.filter((t) => !existing.tagIds.includes(t));
      const removed = existing.tagIds.filter((t) => !data.tagIds!.includes(t));
      await Promise.all([
        ...added.map((id) => tagRepository.incrementUsage(id, 1)),
        ...removed.map((id) => tagRepository.incrementUsage(id, -1)),
      ]);
    }

    return mcq;
  },

  async delete(id: string): Promise<boolean> {
    const existing = await mcqRepository.findById(id);
    if (!existing) return false;

    const result = await mcqRepository.softDelete(id);

    // Decrement tag usage counts
    if (result && existing.tagIds.length > 0) {
      await Promise.all(existing.tagIds.map((id) => tagRepository.incrementUsage(id, -1)));
    }

    return result;
  },
};
