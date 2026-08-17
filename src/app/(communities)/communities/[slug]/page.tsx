import { notFound } from 'next/navigation';
import { ShieldCheck, Lock } from 'lucide-react';
import { auth } from '@/lib/auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { isAdmin } from '@/lib/roles';
import { Badge } from '@/components/ui/badge';
import { CommunityFeed } from '@/components/community/community-feed';

export const dynamic = 'force-dynamic';

export default async function CommunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;

  const community = await communityRepository.findBySlug(slug);
  if (!community) notFound();

  const visible = await communityRepository.canView(community, session?.user.id ?? null, session?.user.role ?? null, community.id);
  if (!visible) notFound();

  const [membership, posts, exam] = await Promise.all([
    session?.user ? communityRepository.getMembership(community.id, session.user.id) : Promise.resolve(null),
    communityRepository.listPosts(community.id),
    community.examId ? taxonomyRepository.findExamById(community.examId) : Promise.resolve(null),
  ]);

  const votes = await communityRepository.userVotes(
    session?.user.id ?? null,
    'POST',
    posts.map((p) => p.id),
  );
  const initialPosts = posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString(), myVote: votes.get(p.id) ?? null }));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-2">
        {community.kind === 'OFFICIAL' && (
          <Badge variant="secondary">
            <ShieldCheck className="h-3 w-3" /> Official{exam ? ` · ${exam.name}` : ''}
          </Badge>
        )}
        {community.visibility === 'PRIVATE' && (
          <Badge variant="secondary">
            <Lock className="h-3 w-3" /> Private
          </Badge>
        )}
      </div>
      <h1 className="mt-2 font-headline-lg text-headline-lg text-foreground">{community.name}</h1>

      <div className="mt-6">
        <CommunityFeed
          community={{
            id: community.id,
            slug: community.slug,
            name: community.name,
            description: community.description,
            kind: community.kind,
            memberCount: community.memberCount,
            visibility: community.visibility,
            createdAt: community.createdAt.toISOString(),
            myRole: membership?.role ?? null,
          }}
          initialPosts={initialPosts}
          currentUserId={session?.user.id ?? null}
          platformAdmin={session?.user ? isAdmin(session.user.role) : false}
        />
      </div>
    </div>
  );
}
