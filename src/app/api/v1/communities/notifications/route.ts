import { requireAuth } from '@/server/auth/require-auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { apiSuccess } from '@/lib/utils';

export async function GET(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');

  const [notifications, unreadCount] = await Promise.all([
    communityRepository.listNotifications(session!.user.id, { cursor: cursor ? Number(cursor) : undefined }),
    communityRepository.unreadNotificationCount(session!.user.id),
  ]);

  return apiSuccess({ notifications, unreadCount });
}
