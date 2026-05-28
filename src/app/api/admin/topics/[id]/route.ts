import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { topicRepository } from '@/server/repositories/topic.repository';
import { UpdateTopicSchema, MoveTopicSchema, ReorderTopicsSchema } from '@/schemas';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const topic = await topicRepository.findById(id);
  if (!topic) return apiError('Topic not found', 404);
  return apiSuccess(topic);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  // Handle move operation
  if ('newParentId' in body) {
    const parsed = MoveTopicSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    try {
      await topicRepository.moveTopic(id, parsed.data.newParentId);
      const updated = await topicRepository.findById(id);
      return apiSuccess(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to move topic';
      return Response.json({ error: message }, { status: 422 });
    }
  }

  // Handle reorder operation
  if ('orderedIds' in body) {
    const parsed = ReorderTopicsSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { getMongoDb } = await import('@/lib/mongodb');
    const db = await getMongoDb();
    const now = new Date().toISOString();
    await Promise.all(
      parsed.data.orderedIds.map((topicId, index) =>
        db.collection('topics').updateOne({ id: topicId }, { $set: { order: index, updatedAt: now } })
      )
    );
    return apiSuccess({ reordered: true });
  }

  // Standard update
  const parsed = UpdateTopicSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const topic = await topicRepository.update(id, parsed.data);
  if (!topic) return apiError('Topic not found', 404);
  return apiSuccess(topic);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  try {
    await topicRepository.softDelete(id);
    return apiSuccess({ deleted: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete topic';
    return Response.json({ error: message }, { status: 422 });
  }
}
