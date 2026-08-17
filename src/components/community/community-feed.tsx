'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Pin, MessageSquare, Users, Settings, MoreVertical, Trash2, PinOff, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { BlogContent } from '@/components/blog/blog-content';
import { VoteBox } from '@/components/community/vote-box';
import { COMMUNITY_LIMITS } from '@/lib/community-limits';
import { cn, formatDate } from '@/lib/utils';

interface PostView {
  id: number;
  authorId: string;
  body: string;
  imageUrl: string | null;
  isPinned: boolean;
  upvoteCount: number; // net score
  commentCount: number;
  createdAt: string;
  authorName: string | null;
  authorImage: string | null;
  myVote: 1 | -1 | null;
}

interface CommunityView {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: 'OFFICIAL' | 'USER_CREATED';
  memberCount: number;
  visibility: string;
  createdAt: string;
  myRole: 'OWNER' | 'MODERATOR' | 'MEMBER' | null;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json.data;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

type SortMode = 'hot' | 'new';

export function CommunityFeed({
  community,
  initialPosts,
  currentUserId,
  platformAdmin = false,
}: {
  community: CommunityView;
  initialPosts: PostView[];
  /** null for an anonymous (signed-out) visitor — this page is public. */
  currentUserId: string | null;
  /** ADMIN/SUPER_ADMIN can moderate (pin/remove posts, manage members) without joining —
   * see community.repository.ts's removeMember/updateMemberRole override. Never grants
   * posting/commenting/voting, which stays tied to actual membership. */
  platformAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [myRole, setMyRole] = useState(community.myRole);
  const [memberCount, setMemberCount] = useState(community.memberCount);
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [sort, setSort] = useState<SortMode>('new');
  const isModerator = myRole === 'OWNER' || myRole === 'MODERATOR' || platformAdmin;

  function requireSignIn() {
    router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  const sortedPosts = useMemo(() => {
    const pinned = posts.filter((p) => p.isPinned);
    const rest = [...posts.filter((p) => !p.isPinned)].sort((a, b) =>
      sort === 'hot' ? b.upvoteCount - a.upvoteCount : b.id - a.id,
    );
    return [...pinned, ...rest];
  }, [posts, sort]);

  async function join() {
    setJoining(true);
    try {
      await fetchJson(`/api/v1/communities/${community.id}/join`, { method: 'POST' });
      setMyRole('MEMBER');
      setMemberCount((c) => c + 1);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not join');
    } finally {
      setJoining(false);
    }
  }

  async function leave() {
    if (myRole === 'OWNER') return toast.error("You're the owner — archive the community instead of leaving.");
    setJoining(true);
    try {
      await fetchJson(`/api/v1/communities/${community.id}/leave`, { method: 'POST' });
      setMyRole(null);
      setMemberCount((c) => Math.max(0, c - 1));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not leave');
    } finally {
      setJoining(false);
    }
  }

  async function submitPost() {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const post: PostView = await fetchJson(`/api/v1/communities/${community.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft }),
      });
      setPosts((prev) => [{ ...post, myVote: null }, ...prev]);
      setDraft('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not post');
    } finally {
      setPosting(false);
    }
  }

  async function vote(postId: number, value: 1 | -1) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const wasSame = p.myVote === value;
        const delta = wasSame ? -value : p.myVote ? 2 * value : value;
        return { ...p, myVote: wasSame ? null : value, upvoteCount: p.upvoteCount + delta };
      }),
    );
    try {
      await fetchJson(`/api/v1/communities/${community.id}/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not vote');
      router.refresh();
    }
  }

  async function togglePin(postId: number, pinned: boolean) {
    try {
      await fetchJson(`/api/v1/communities/${community.id}/posts/${postId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isPinned: pinned } : p)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update pin');
    }
  }

  async function removePost(postId: number) {
    try {
      await fetchJson(`/api/v1/communities/${community.id}/posts/${postId}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove post');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="min-w-0">
        {myRole && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share a question, a solution, or an update… (Markdown + LaTeX supported)"
              className="min-h-[80px] resize-none"
              maxLength={COMMUNITY_LIMITS.POST_BODY_MAX}
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={submitPost} disabled={posting || !draft.trim()}>
                {posting ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        )}
        {!currentUserId && (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Sign in to join the discussion.</p>
            <Button size="sm" onClick={requireSignIn}>
              Sign in
            </Button>
          </div>
        )}

        <div className="mt-4 flex items-center gap-1 border-b border-border">
          <button
            type="button"
            onClick={() => setSort('hot')}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              sort === 'hot' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Flame className="h-4 w-4" /> Hot
          </button>
          <button
            type="button"
            onClick={() => setSort('new')}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              sort === 'new' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Sparkles className="h-4 w-4" /> New
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {sortedPosts.length === 0 && <p className="text-sm text-muted-foreground">No posts yet — be the first to start a discussion.</p>}
          {sortedPosts.map((post) => (
            <article key={post.id} className="flex rounded-2xl border border-border bg-card p-1 shadow-sm">
              <div className="flex w-12 shrink-0 items-center justify-center rounded-l-xl bg-muted/40 py-4">
                <VoteBox
                  score={post.upvoteCount}
                  myVote={post.myVote}
                  onVote={(v) => (!currentUserId ? requireSignIn() : myRole ? vote(post.id, v) : toast.error('Join the community to vote'))}
                />
              </div>
              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {post.authorImage && <AvatarImage src={post.authorImage} alt="" />}
                      <AvatarFallback>{(post.authorName ?? '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{post.authorName ?? 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                    {post.isPinned && (
                      <Badge variant="secondary">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                  </div>
                  {(isModerator || post.authorId === currentUserId) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isModerator && (
                          <DropdownMenuItem onClick={() => togglePin(post.id, !post.isPinned)}>
                            {post.isPinned ? (
                              <>
                                <PinOff className="h-4 w-4" /> Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4" /> Pin
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => removePost(post.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="mt-2">
                  <BlogContent content={post.body} />
                </div>
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary pasted URL, not a project-local asset
                  <img src={post.imageUrl} alt="" loading="lazy" className="mt-3 max-h-[420px] w-full rounded-lg object-cover" />
                )}

                <div className="mt-3 flex items-center gap-4">
                  <Link href={`/communities/${community.slug}/posts/${post.id}`} className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
                    <MessageSquare className="h-3.5 w-3.5" /> {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-label-caps uppercase text-muted-foreground">About</p>
            {isModerator && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/communities/${community.slug}/members`}>
                  <Settings className="h-3.5 w-3.5" /> Manage
                </Link>
              </Button>
            )}
          </div>
          {community.description && <p className="mt-2 text-sm text-muted-foreground">{community.description}</p>}
          <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Created {formatDate(community.createdAt)}</p>

          <div className="mt-4 border-t border-border pt-4">
            {myRole === null && community.visibility === 'PUBLIC' && (
              <Button className="w-full" onClick={currentUserId ? join : requireSignIn} disabled={joining}>
                Join community
              </Button>
            )}
            {myRole && myRole !== 'OWNER' && (
              <Button className="w-full" variant="outline" onClick={leave} disabled={joining}>
                Leave
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
