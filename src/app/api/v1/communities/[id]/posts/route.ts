import { requireAuth, optionalAuth } from '@/server/auth/require-auth';
import { communityRepository, COMMUNITY_ERROR_STATUS } from '@/server/repositories/community.repository';
import { CreatePostSchema } from '@/schemas/community.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// Read-only — answers PUBLIC data to anonymous callers (see optionalAuth).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await optionalAuth();

  const { id } = await params;
  const community = await communityRepository.findById(id);
  if (!community) return apiError('Not found', 404);

  const visible = await communityRepository.canView(community, userId, role, id);
  if (!visible) return apiError('Not found', 404);

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const posts = await communityRepository.listPosts(id, { cursor: cursor ? Number(cursor) : undefined });

  const votes = await communityRepository.userVotes(
    userId,
    'POST',
    posts.map((p) => p.id),
  );
  return apiSuccess(posts.map((p) => ({ ...p, myVote: votes.get(p.id) ?? null })));
}

// Members only — createPost itself enforces this (NOT_A_MEMBER), checked here too so the
// error message distinguishes "you're not in this community" from a generic 400.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const parsed = CreatePostSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  try {
    const post = await communityRepository.createPost(id, session!.user.id, parsed.data);
    return apiSuccess(post, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create post';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}
