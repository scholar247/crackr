import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { getMongoDb } from '@/lib/mongodb';

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;

  try {
    const db = await getMongoDb();

    // Count MCQs directly assigned to this topic
    const mcqCount = await db.collection('mcqs').countDocuments({
      topicId: id,
      isActive: true,
    });

    await db.collection('topics').updateOne(
      { id },
      { $set: { mcqCount, updatedAt: new Date().toISOString() } }
    );

    return apiSuccess({ id, mcqCount });
  } catch (err) {
    console.error('[refresh-counts/topic]', err);
    return apiError('Failed to refresh counts', 500);
  }
}
