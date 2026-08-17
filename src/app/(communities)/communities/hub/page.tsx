import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Zap, Users, ArrowRight, Compass } from 'lucide-react';
import { auth } from '@/lib/auth';
import { communityRepository } from '@/server/repositories/community.repository';
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

export default async function CommunityHubPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=%2Fcommunities%2Fhub');

  const [mineWithActivity, discover] = await Promise.all([
    communityRepository.listMineWithActivity(session.user.id),
    communityRepository.findVisibleToUser(session.user.id, session.user.role),
  ]);

  const mineIds = new Set(mineWithActivity.map((c) => c.id));
  const recommended = discover.filter((c) => !mineIds.has(c.id)).slice(0, 6);
  const recentlyActive = mineWithActivity.filter((c) => c.latestPost).slice(0, 4);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-foreground">My Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your communities and what&apos;s happening in them.</p>
        </div>
      </div>

      {recentlyActive.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-foreground">
            <Zap className="h-5 w-5 text-success" /> Recently active
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recentlyActive.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-label-md text-foreground">{c.name}</p>
                  <Link href={`/communities/${c.slug}`} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    Open <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <Users className="mr-1 inline h-3 w-3" />
                  {c.memberCount} members
                </p>
                {c.latestPost && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      @{c.latestPost.authorName ?? 'unknown'} · {timeAgo(c.latestPost.createdAt.toISOString())}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground">{c.latestPost.body}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-headline-md text-headline-md text-foreground">My communities ({mineWithActivity.length})</h2>
        {mineWithActivity.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">You haven&apos;t joined a community yet.</p>
        ) : (
          <CommunityGrid items={mineWithActivity} />
        )}
      </section>

      {recommended.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-foreground">
            <Compass className="h-5 w-5 text-tertiary" /> Recommended for you
          </h2>
          <CommunityGrid items={recommended} />
        </section>
      )}
    </div>
  );
}
