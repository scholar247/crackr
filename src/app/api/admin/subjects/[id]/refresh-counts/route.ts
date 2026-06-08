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

    const [topicCount, mcqCount] = await Promise.all([
      db.collection('topics').countDocuments({ subjectId: id, isActive: true }),
      db.collection('mcqs').countDocuments({ subjectId: id, isActive: true }),
    ]);

    await db.collection('subjects').updateOne(
      { id },
      { $set: { topicCount, mcqCount, updatedAt: new Date().toISOString() } }
    );

    return apiSuccess({ id, topicCount, mcqCount });
  } catch (err) {
    console.error('[refresh-counts/subject]', err);
    return apiError('Failed to refresh counts', 500);
  }
}
