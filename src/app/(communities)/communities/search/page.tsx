import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { auth } from '@/lib/auth';
import { communityRepository } from '@/server/repositories/community.repository';
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

export default async function CommunitySearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  const { q = '' } = await searchParams;
  const userId = session?.user.id ?? null;
  const role = session?.user.role ?? null;

  const [communities, posts] = q.trim()
    ? await Promise.all([communityRepository.findVisibleToUser(userId, role, { search: q }), communityRepository.searchPosts(q, userId, role)])
    : [[], []];

  return (
    <div>
      <div>
        <h1 className="font-headline-lg text-headline-lg text-foreground">Search</h1>
        <CommunitySearchBox className="mt-4 max-w-lg" defaultValue={q} />
      </div>

      {q.trim() && (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {communities.length + posts.length} result{communities.length + posts.length === 1 ? '' : 's'} for &ldquo;{q}&rdquo;
          </p>

          {communities.length > 0 && (
            <section className="mt-6">
              <h2 className="font-headline-md text-headline-md text-foreground">Communities ({communities.length})</h2>
              <CommunityGrid items={communities} />
            </section>
          )}

          {posts.length > 0 && (
            <section className="mt-8">
              <h2 className="font-headline-md text-headline-md text-foreground">Posts ({posts.length})</h2>
              <div className="mt-4 space-y-3">
                {posts.map((post) => (
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

          {communities.length === 0 && posts.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No results.</p>}
        </>
      )}
    </div>
  );
}
