import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { getMongoDb } from '@/lib/mongodb';

export async function GET(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') ?? '30');
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fromIso = fromDate.toISOString();

  const db = await getMongoDb();

  const [attempts, totalMCQs, totalUsers, activeTests] = await Promise.all([
    db.collection('testAttempts')
      .find({ status: 'EVALUATED', submittedAt: { $gte: fromIso } })
      .sort({ submittedAt: -1 })
      .limit(500)
      .toArray(),
    db.collection('mcqs').countDocuments({ isActive: true }),
    db.collection('users').countDocuments({}),
    db.collection('tests').countDocuments({ status: 'PUBLISHED' }),
  ]);

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0
    ? attempts.reduce((sum, a) => sum + (a.totalMarks > 0 ? (a.marksObtained / a.totalMarks) * 100 : 0), 0) / totalAttempts
    : 0;

  const distribution = [0, 0, 0, 0, 0];
  attempts.forEach((a) => {
    const pct = a.totalMarks > 0 ? (a.marksObtained / a.totalMarks) * 100 : 0;
    const bucket = Math.min(Math.floor(pct / 20), 4);
    distribution[bucket]++;
  });

  const scoreDistribution = [
    { range: '0–20%', count: distribution[0] },
    { range: '20–40%', count: distribution[1] },
    { range: '40–60%', count: distribution[2] },
    { range: '60–80%', count: distribution[3] },
    { range: '80–100%', count: distribution[4] },
  ];

  const dailyMap = new Map<string, number>();
  attempts.forEach((a) => {
    const date = (a.submittedAt as string ?? '').slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
  });

  const dailyTrend = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const testCountMap = new Map<string, { count: number; totalScore: number }>();
  attempts.forEach((a) => {
    const existing = testCountMap.get(a.testId) ?? { count: 0, totalScore: 0 };
    const pct = a.totalMarks > 0 ? (a.marksObtained / a.totalMarks) * 100 : 0;
    testCountMap.set(a.testId, { count: existing.count + 1, totalScore: existing.totalScore + pct });
  });

  const topTestIds = Array.from(testCountMap.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([id]) => id);

  const testDocs = await db.collection('tests').find({ id: { $in: topTestIds } }).toArray();
  const testMap = new Map(testDocs.map((d) => [d.id as string, d.title as string]));

  const topTests = topTestIds.map((id) => {
    const stats = testCountMap.get(id)!;
    return {
      id,
      title: testMap.get(id) ?? 'Unknown Test',
      attempts: stats.count,
      avgScore: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
    };
  });

  return apiSuccess({
    overview: { totalMCQs, totalUsers, activeTests, totalAttempts, avgScore: Math.round(avgScore) },
    scoreDistribution,
    dailyTrend,
    topTests,
  });
}
