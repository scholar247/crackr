'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { BlogContent } from '@/components/blog/blog-content';
import { InlineMarkdown } from '@/components/questions/inline-markdown';
import { VoteBox } from '@/components/community/vote-box';
import { COMMUNITY_LIMITS } from '@/lib/community-limits';

interface CommentView {
  id: number;
  authorId: string;
  parentCommentId: number | null;
  body: string;
  createdAt: string;
  authorName: string | null;
  authorImage: string | null;
  myVote: 1 | -1 | null;
  score: number;
}

interface PostView {
  id: number;
  authorId: string;
  body: string;
  imageUrl: string | null;
  upvoteCount: number; // net score
  createdAt: string;
  authorName: string | null;
  authorImage: string | null;
  myVote: 1 | -1 | null;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json.data;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function PostThread({
  communityId,
  communitySlug,
  post: initialPost,
  initialComments,
  currentUserId,
  isModerator,
  canParticipate,
}: {
  communityId: string;
  communitySlug: string;
  post: PostView;
  initialComments: CommentView[];
  /** null for an anonymous (signed-out) visitor — this page is public. */
  currentUserId: string | null;
  isModerator: boolean;
  canParticipate: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const topLevel = useMemo(() => comments.filter((c) => !c.parentCommentId), [comments]);
  const repliesByParent = useMemo(() => {
    const map = new Map<number, CommentView[]>();
    for (const c of comments) {
      if (c.parentCommentId) map.set(c.parentCommentId, [...(map.get(c.parentCommentId) ?? []), c]);
    }
    return map;
  }, [comments]);

  async function votePost(value: 1 | -1) {
    setPost((p) => {
      const wasSame = p.myVote === value;
      const delta = wasSame ? -value : p.myVote ? 2 * value : value;
      return { ...p, myVote: wasSame ? null : value, upvoteCount: p.upvoteCount + delta };
    });
    try {
      await fetchJson(`/api/v1/communities/${communityId}/posts/${post.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not vote');
      router.refresh();
    }
  }

  async function voteComment(commentId: number, value: 1 | -1) {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const wasSame = c.myVote === value;
        const delta = wasSame ? -value : c.myVote ? 2 * value : value;
        return { ...c, myVote: wasSame ? null : value, score: c.score + delta };
      }),
    );
    try {
      await fetchJson(`/api/v1/communities/${communityId}/posts/${post.id}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not vote');
      router.refresh();
    }
  }

  async function submitComment(body: string, parentCommentId?: number) {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const comment: CommentView = await fetchJson(`/api/v1/communities/${communityId}/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, parentCommentId }),
      });
      setComments((prev) => [...prev, { ...comment, myVote: null, score: 0 }]);
      if (parentCommentId) {
        setReplyDraft('');
        setReplyTo(null);
      } else {
        setDraft('');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeComment(commentId: number) {
    try {
      await fetchJson(`/api/v1/communities/${communityId}/posts/${post.id}/comments/${commentId}`, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentCommentId !== commentId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove comment');
    }
  }

  // Additive: the comment's own author, a community moderator/admin, OR the post's author
  // (even if they're a plain member and didn't write the comment) can delete a comment.
  const postAuthorCanDeleteAny = post.authorId === currentUserId;

  function requireSignIn() {
    router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/communities/${communitySlug}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to community
      </Link>

      <div className="mt-4 flex rounded-2xl border border-border bg-card p-1 shadow-sm">
        <div className="flex w-12 shrink-0 items-center justify-center rounded-l-xl bg-muted/40 py-4">
          <VoteBox
            score={post.upvoteCount}
            myVote={post.myVote}
            onVote={(v) => (!currentUserId ? requireSignIn() : canParticipate ? votePost(v) : toast.error('Join the community to vote'))}
          />
        </div>
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              {post.authorImage && <AvatarImage src={post.authorImage} alt="" />}
              <AvatarFallback>{(post.authorName ?? '?').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{post.authorName ?? 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <div className="mt-3">
            <BlogContent content={post.body} />
          </div>
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary pasted URL, not a project-local asset
            <img src={post.imageUrl} alt="" loading="lazy" className="mt-3 max-h-[420px] w-full rounded-lg object-cover" />
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-foreground">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </p>

        {canParticipate && (
          <div className="mt-3 rounded-xl border border-border bg-card p-3">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a comment…" maxLength={COMMUNITY_LIMITS.COMMENT_BODY_MAX} className="min-h-[70px]" />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={() => submitComment(draft)} disabled={submitting || !draft.trim()}>
                Comment
              </Button>
            </div>
          </div>
        )}
        {!currentUserId && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <p className="text-sm text-muted-foreground">Sign in to comment.</p>
            <Button size="sm" onClick={requireSignIn}>
              Sign in
            </Button>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {topLevel.map((comment) => (
            <div key={comment.id}>
              <CommentRow
                comment={comment}
                isSignedIn={currentUserId !== null}
                canParticipate={canParticipate}
                canRemove={isModerator || comment.authorId === currentUserId || postAuthorCanDeleteAny}
                onVote={(v) => voteComment(comment.id, v)}
                onRemove={() => removeComment(comment.id)}
                onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                onRequireSignIn={requireSignIn}
              />

              {replyTo === comment.id && (
                <div className="ml-6 mt-2 rounded-xl border border-border bg-card p-3 sm:ml-9">
                  <Textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder={`Reply to ${comment.authorName ?? 'this comment'}…`} className="min-h-[60px]" />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => submitComment(replyDraft, comment.id)} disabled={submitting || !replyDraft.trim()}>
                      Reply
                    </Button>
                  </div>
                </div>
              )}

              <div className="ml-6 mt-2 space-y-2 border-l-2 border-border pl-3 sm:ml-9 sm:pl-4">
                {(repliesByParent.get(comment.id) ?? []).map((reply) => (
                  <CommentRow
                    key={reply.id}
                    comment={reply}
                    isSignedIn={currentUserId !== null}
                    canParticipate={canParticipate}
                    canRemove={isModerator || reply.authorId === currentUserId || postAuthorCanDeleteAny}
                    onVote={(v) => voteComment(reply.id, v)}
                    onRemove={() => removeComment(reply.id)}
                    onRequireSignIn={requireSignIn}
                  />
                ))}
              </div>
            </div>
          ))}
          {topLevel.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        </div>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  isSignedIn,
  canParticipate,
  canRemove,
  onVote,
  onRemove,
  onReply,
  onRequireSignIn,
}: {
  comment: CommentView;
  isSignedIn: boolean;
  canParticipate: boolean;
  canRemove: boolean;
  onVote: (value: 1 | -1) => void;
  onRemove: () => void;
  onReply?: () => void;
  onRequireSignIn: () => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="flex shrink-0 items-center justify-center rounded-lg bg-muted/40 px-1">
        <VoteBox
          size="sm"
          score={comment.score}
          myVote={comment.myVote}
          onVote={(v) => (!isSignedIn ? onRequireSignIn() : canParticipate ? onVote(v) : toast.error('Join the community to vote'))}
        />
      </div>
      <Avatar className="h-7 w-7 shrink-0">
        {comment.authorImage && <AvatarImage src={comment.authorImage} alt="" />}
        <AvatarFallback>{(comment.authorName ?? '?').charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 rounded-lg bg-muted/40 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-foreground">{comment.authorName ?? 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          {canRemove && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRemove} className="text-destructive">
                  <Trash2 className="h-4 w-4" /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="mt-1 text-sm text-foreground">
          <InlineMarkdown content={comment.body} />
        </p>
        {onReply && canParticipate && (
          <div className="mt-2">
            <button type="button" onClick={onReply} className="text-xs text-muted-foreground hover:text-foreground">
              Reply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
