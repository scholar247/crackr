import { optionalAuth } from '@/server/auth/require-auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { apiError, apiSuccess } from '@/lib/utils';

// Read-only — answers PUBLIC data to anonymous callers (see optionalAuth). Searches
// communities (name/description) and posts (body) across everything the caller can view.
export async function GET(req: Request) {
  const { userId, role } = await optionalAuth();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  if (!q) return apiError('Missing search query', 400);

  const [communities, posts] = await Promise.all([
    communityRepository.findVisibleToUser(userId, role, { search: q }),
    communityRepository.searchPosts(q, userId, role),
  ]);

  return apiSuccess({ communities, posts });
}
