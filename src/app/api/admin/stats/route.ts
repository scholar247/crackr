import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { getMongoDb } from '@/lib/mongodb';

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const db = await getMongoDb();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalMCQs, activeTests, registeredUsers, attemptsToday] = await Promise.all([
    db.collection('mcqs').countDocuments({ isActive: true }),
    db.collection('tests').countDocuments({ status: 'PUBLISHED' }),
    db.collection('users').countDocuments({}),
    db.collection('testAttempts').countDocuments({ submittedAt: { $gte: todayStart.toISOString() } }),
  ]);

  return apiSuccess({ totalMCQs, activeTests, registeredUsers, attemptsToday });
}
