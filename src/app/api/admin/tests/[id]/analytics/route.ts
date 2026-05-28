import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { testService } from '@/server/services/test.service';
import { userRepository } from '@/server/repositories/user.repository';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const analytics = await testService.getAnalytics(id);
  if (!analytics) return apiError('Test not found', 404);

  const leaderboard = analytics.leaderboard ?? [];
  const userIds = leaderboard.map((e) => e.userId);
  const users = await Promise.all(userIds.map((uid) => userRepository.findById(uid)));
  const userMap = new Map(users.filter(Boolean).map((u) => [u!.id, u!]));
  const enrichedLeaderboard = leaderboard.map((entry) => ({
    ...entry,
    name: userMap.get(entry.userId)?.name ?? 'Unknown',
    email: userMap.get(entry.userId)?.email ?? '',
  }));

  return apiSuccess({ ...analytics, leaderboard: enrichedLeaderboard });
}
