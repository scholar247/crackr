import Link from 'next/link';
import { Plus, MessageSquare } from 'lucide-react';
import { auth } from '@/lib/auth';
import { communityRepository } from '@/server/repositories/community.repository';
import { Button } from '@/components/ui/button';
import { CommunitySearchBox } from '@/components/community/community-search-box';
import { CommunityGrid } from '@/components/community/community-grid';

export const dynamic = 'force-dynamic';

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function CommunitiesHomePage() {
  const session = await auth();
  const userId = session?.user.id ?? null;
  const role = session?.user.role ?? null;

  const [mine, discover, official, recentPosts] = await Promise.all([
    userId ? communityRepository.listMine(userId) : Promise.resolve([]),
    communityRepository.findVisibleToUser(userId, role),
    communityRepository.findVisibleToUser(userId, role, { kind: 'OFFICIAL' }),
    communityRepository.listRecentPostsAcrossVisible(userId, role, 6),
  ]);

  const mineIds = new Set(mine.map((c) => c.id));
  const toDiscover = discover.filter((c) => !mineIds.has(c.id));

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-muted/40 p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />
        <div className="relative">
          <h1 className="font-headline-lg text-headline-lg text-foreground">
            Learn together. <span className="text-primary">Share knowledge. Grow.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-body-md text-muted-foreground">
            Join communities of fellow aspirants. Ask questions, share resources, and discuss with peers preparing for the same exams.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CommunitySearchBox className="w-full sm:max-w-sm" />
            <Button asChild>
              <Link href="/communities/new">
                <Plus className="h-4 w-4" /> Create Community
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {official.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-foreground">Official Hubs</h2>
            <Link href="/communities/official" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <CommunityGrid items={official.slice(0, 4)} />
        </section>
      )}

      {userId ? (
        <section className="mt-10">
          <h2 className="font-headline-md text-headline-md text-foreground">My communities</h2>
          {mine.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">You haven&apos;t joined a community yet.</p>
          ) : (
            <CommunityGrid items={mine} />
          )}
        </section>
      ) : (
        <section className="mt-10 flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div>
            <p className="font-label-md text-foreground">My communities</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Sign in to join communities and track the ones you&apos;re part of.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/sign-in?callbackUrl=%2Fcommunities">Sign in</Link>
          </Button>
        </section>
      )}

      {toDiscover.length > 0 && (
        <section className="mt-10">
          <h2 className="font-headline-md text-headline-md text-foreground">Discover</h2>
          <CommunityGrid items={toDiscover} />
        </section>
      )}

      {recentPosts.length > 0 && (
        <section className="mt-10">
          <h2 className="font-headline-md text-headline-md text-foreground">Recent activity</h2>
          <div className="mt-4 space-y-3">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/communities/${post.communitySlug}/posts/${post.id}`}
                className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{post.communityName}</span>
                  <span>•</span>
                  <span>{post.authorName ?? 'Unknown'}</span>
                  <span>•</span>
                  <span>{timeAgo(post.createdAt.toISOString())}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-foreground">{post.body}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" /> {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
