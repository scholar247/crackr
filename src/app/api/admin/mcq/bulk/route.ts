import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { mcqRepository } from '@/server/repositories/mcq.repository';
import { topicRepository } from '@/server/repositories/topic.repository';
import { getMongoDb } from '@/lib/mongodb';
import { z } from 'zod';
import { MCQStatusSchema } from '@/schemas';

const BulkSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('delete'), ids: z.array(z.string()).min(1).max(100) }),
  z.object({ action: z.literal('setStatus'), ids: z.array(z.string()).min(1).max(100), status: MCQStatusSchema }),
]);

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const body = await req.json();
  const parsed = BulkSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  const { action, ids } = parsed.data;

  if (action === 'delete') {
    const mcqs = await mcqRepository.findByIds(ids);
    await Promise.all(ids.map((id) => mcqRepository.softDelete(id)));

    // Decrement topic mcqCounts
    const topicDecrements = new Map<string, number>();
    for (const mcq of mcqs) {
      if (mcq.topicId) {
        topicDecrements.set(mcq.topicId, (topicDecrements.get(mcq.topicId) ?? 0) + 1);
      }
    }
    await Promise.all(
      Array.from(topicDecrements.entries()).map(([topicId, count]) =>
        topicRepository.incrementMCQCount(topicId, -count)
      )
    );

    return apiSuccess({ deleted: ids.length });
  }

  if (action === 'setStatus') {
    const { status } = parsed.data;
    const isActive = status === 'PUBLISHED';
    const db = await getMongoDb();
    await db.collection('mcqs').updateMany(
      { id: { $in: ids } },
      { $set: { status, isActive, updatedAt: new Date().toISOString() } }
    );
    return apiSuccess({ updated: ids.length });
  }
}
