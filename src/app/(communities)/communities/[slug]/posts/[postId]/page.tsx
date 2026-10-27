import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { isAdmin } from '@/lib/roles';
import { PostThread } from '@/components/community/post-thread';

export const dynamic = 'force-dynamic';

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string; postId: string }> }) {
  const session = await auth();
  const { slug, postId } = await params;
  const userId = session?.user.id ?? null;
  const role = session?.user.role ?? null;

  const community = await communityRepository.findBySlug(slug);
  if (!community) notFound();

  const visible = await communityRepository.canView(community, userId, role, community.id);
  if (!visible) notFound();

  const post = await communityRepository.getPost(Number(postId));
  if (!post || post.communityId !== community.id) notFound();

  const [membership, comments] = await Promise.all([
    userId ? communityRepository.getMembership(community.id, userId) : Promise.resolve(null),
    communityRepository.listComments(post.id),
  ]);

  const [postVotes, commentVotes, commentScores] = await Promise.all([
    communityRepository.userVotes(userId, 'POST', [post.id]),
    communityRepository.userVotes(
      userId,
      'COMMENT',
      comments.map((c) => c.id),
    ),
    communityRepository.commentScores(comments.map((c) => c.id)),
  ]);

  const isModerator = membership?.role === 'OWNER' || membership?.role === 'MODERATOR' || (role ? isAdmin(role) : false);

  return (
    <PostThread
      communityId={community.id}
      communitySlug={community.slug}
      post={{ ...post, createdAt: post.createdAt.toISOString(), myVote: postVotes.get(post.id) ?? null }}
      initialComments={comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        myVote: commentVotes.get(c.id) ?? null,
        score: commentScores.get(c.id) ?? 0,
      }))}
      currentUserId={userId}
      isModerator={isModerator}
      canParticipate={membership !== null}
    />
  );
}
