import { randomUUID } from 'crypto';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { communities, communityMembers, communityPosts, communityPostComments, communityReactions, communityNotifications, users } from '@/server/db/schema';
import { slugify } from '@/lib/utils';
import { COMMUNITY_LIMITS } from '@/lib/community-limits';
import type { UserRole } from '@/lib/roles';
import { isAdmin } from '@/lib/roles';

// Every function below throws plain Error(CODE) for control-flow errors — the one place
// API routes translate those into HTTP statuses, same pattern (and same reasoning) as
// ASSESSMENT_ERROR_STATUS in assessment.repository.ts.
export const COMMUNITY_ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  ALREADY_MEMBER: 409,
  NOT_A_MEMBER: 409,
  PRIVATE_COMMUNITY: 403,
  OWNER_CANNOT_LEAVE: 409,
  CANNOT_REMOVE_OWNER: 403,
  CANNOT_DEMOTE_OWNER: 403,
  INVALID_PARENT_COMMENT: 400,
  PIN_LIMIT_REACHED: 409,
  OFFICIAL_EXISTS_FOR_EXAM: 409,
};

type MemberRole = 'OWNER' | 'MODERATOR' | 'MEMBER';

async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  while (true) {
    const [existing] = await db.select({ id: communities.id }).from(communities).where(eq(communities.slug, candidate)).limit(1);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

// ── Communities ──────────────────────────────────────────────────────────────

async function createCommunity(input: {
  name: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  bannerImage?: string;
  examId?: string;
  programId?: string;
  kind: 'OFFICIAL' | 'USER_CREATED';
  creatorUserId: string;
}) {
  // MySQL can't express "unique examId, but only among OFFICIAL rows" as a constraint
  // (no partial/filtered index) — enforced here instead. Not inside the transaction below:
  // this is a plain check-then-insert, same tradeoff article.repository.ts's slug
  // uniqueness loop already accepts (no replica set / no realistic concurrent-create race
  // at this product's scale — see project memory on the single-node MySQL setup).
  if (input.kind === 'OFFICIAL' && input.examId) {
    const [existing] = await db
      .select({ id: communities.id })
      .from(communities)
      .where(and(eq(communities.kind, 'OFFICIAL'), eq(communities.examId, input.examId)))
      .limit(1);
    if (existing) throw new Error('OFFICIAL_EXISTS_FOR_EXAM');
  }

  const slug = await ensureUniqueSlug(slugify(input.name));
  const id = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(communities).values({
      id,
      slug,
      name: input.name,
      description: input.description,
      kind: input.kind,
      visibility: input.visibility,
      examId: input.examId,
      programId: input.programId,
      bannerImage: input.bannerImage,
      creatorUserId: input.creatorUserId,
    });
    await tx.insert(communityMembers).values({ communityId: id, userId: input.creatorUserId, role: 'OWNER' });
  });

  return findById(id);
}

async function findById(id: string) {
  const [row] = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
  return row ?? null;
}

async function findBySlug(slug: string) {
  const [row] = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);
  return row ?? null;
}

async function getMembership(communityId: string, userId: string): Promise<{ role: MemberRole } | null> {
  const [row] = await db
    .select({ role: communityMembers.role })
    .from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
    .limit(1);
  return row ?? null;
}

/** PUBLIC communities are visible to anyone (including anonymous callers); PRIVATE ones only to members and admins. */
async function canView(community: { visibility: string }, userId: string | null, role: UserRole | null, communityId: string): Promise<boolean> {
  if (community.visibility === 'PUBLIC') return true;
  if (!userId || !role) return false;
  if (isAdmin(role)) return true;
  return (await getMembership(communityId, userId)) !== null;
}

// Lists communities visible to the caller: every PUBLIC one, plus PRIVATE ones they belong
// to (or, with scopeAll, everything — admin-only, same escape hatch as
// assessmentRepository.findVisibleToUser's ?scope=all).
async function findVisibleToUser(
  userId: string | null,
  role: UserRole | null,
  filters: { examId?: string; programId?: string; search?: string; kind?: 'OFFICIAL' | 'USER_CREATED'; scopeAll?: boolean } = {},
) {
  const conditions = [eq(communities.status, 'ACTIVE')];
  if (userId && role && filters.scopeAll && isAdmin(role)) {
    // admin scope-all: no visibility filter
  } else if (userId) {
    const membershipSub = db.select({ communityId: communityMembers.communityId }).from(communityMembers).where(eq(communityMembers.userId, userId));
    conditions.push(or(eq(communities.visibility, 'PUBLIC'), inArray(communities.id, membershipSub))!);
  } else {
    // anonymous caller (optionalAuth with no session) — PUBLIC only, no membership to check
    conditions.push(eq(communities.visibility, 'PUBLIC'));
  }
  if (filters.examId) conditions.push(eq(communities.examId, filters.examId));
  if (filters.programId) conditions.push(eq(communities.programId, filters.programId));
  if (filters.kind) conditions.push(eq(communities.kind, filters.kind));
  if (filters.search) conditions.push(or(sql`${communities.name} LIKE ${`%${filters.search}%`}`, sql`${communities.description} LIKE ${`%${filters.search}%`}`)!);

  const rows = await db
    .select({
      community: communities,
      myRole: communityMembers.role,
    })
    .from(communities)
    .leftJoin(
      communityMembers,
      userId ? and(eq(communityMembers.communityId, communities.id), eq(communityMembers.userId, userId)) : sql`false`,
    )
    .where(and(...conditions))
    .orderBy(desc(communities.memberCount));

  return rows.map((r) => ({ ...r.community, myRole: r.myRole ?? null }));
}

async function listMine(userId: string) {
  const rows = await db
    .select({ community: communities, myRole: communityMembers.role })
    .from(communityMembers)
    .innerJoin(communities, eq(communities.id, communityMembers.communityId))
    .where(and(eq(communityMembers.userId, userId), eq(communities.status, 'ACTIVE')))
    .orderBy(desc(communityMembers.joinedAt));
  return rows.map((r) => ({ ...r.community, myRole: r.myRole }));
}

// "My communities" enriched with each one's most recent PUBLISHED post (if any) — powers
// the Community Hub's "Recently active" section. Two queries (not a correlated subquery
// per row) since MySQL's window-function support for "latest row per group" needs a
// derived table anyway; this is simpler and fine at this product's scale.
async function listMineWithActivity(userId: string) {
  const mine = await listMine(userId);
  if (mine.length === 0) return [];
  const ids = mine.map((c) => c.id);

  const latestIds = await db
    .select({ communityId: communityPosts.communityId, latestPostId: sql<number>`max(${communityPosts.id})` })
    .from(communityPosts)
    .where(and(inArray(communityPosts.communityId, ids), eq(communityPosts.status, 'PUBLISHED')))
    .groupBy(communityPosts.communityId);

  const postIds = latestIds.map((r) => r.latestPostId);
  const posts = postIds.length
    ? await db
        .select({ post: communityPosts, authorName: users.name })
        .from(communityPosts)
        .innerJoin(users, eq(users.id, communityPosts.authorId))
        .where(inArray(communityPosts.id, postIds))
    : [];
  const latestByCommunity = new Map(posts.map((p) => [p.post.communityId, { ...p.post, authorName: p.authorName }]));

  return mine
    .map((c) => ({ ...c, latestPost: latestByCommunity.get(c.id) ?? null }))
    .sort((a, b) => (b.latestPost?.createdAt.getTime() ?? 0) - (a.latestPost?.createdAt.getTime() ?? 0));
}

async function updateCommunity(id: string, input: { name?: string; description?: string; visibility?: 'PUBLIC' | 'PRIVATE'; bannerImage?: string }) {
  await db.update(communities).set(input).where(eq(communities.id, id));
  return findById(id);
}

async function archiveCommunity(id: string) {
  await db.update(communities).set({ status: 'ARCHIVED' }).where(eq(communities.id, id));
}

// ── Membership ───────────────────────────────────────────────────────────────

async function join(communityId: string, userId: string) {
  const community = await findById(communityId);
  if (!community) throw new Error('NOT_FOUND');
  if (community.visibility === 'PRIVATE') throw new Error('PRIVATE_COMMUNITY');
  if (await getMembership(communityId, userId)) throw new Error('ALREADY_MEMBER');

  await db.transaction(async (tx) => {
    await tx.insert(communityMembers).values({ communityId, userId, role: 'MEMBER' });
    await tx.update(communities).set({ memberCount: sql`${communities.memberCount} + 1` }).where(eq(communities.id, communityId));
  });
}

// Moderator-added membership — the only way into a PRIVATE community (mirrors group
// tests' organizer-invites-by-email model rather than building a separate
// request-to-join/approval queue this product doesn't need yet).
async function addMember(communityId: string, targetUserId: string) {
  const community = await findById(communityId);
  if (!community) throw new Error('NOT_FOUND');
  if (await getMembership(communityId, targetUserId)) throw new Error('ALREADY_MEMBER');

  await db.transaction(async (tx) => {
    await tx.insert(communityMembers).values({ communityId, userId: targetUserId, role: 'MEMBER' });
    await tx.update(communities).set({ memberCount: sql`${communities.memberCount} + 1` }).where(eq(communities.id, communityId));
  });
}

async function leave(communityId: string, userId: string) {
  const membership = await getMembership(communityId, userId);
  if (!membership) throw new Error('NOT_A_MEMBER');
  if (membership.role === 'OWNER') throw new Error('OWNER_CANNOT_LEAVE');

  await db.transaction(async (tx) => {
    await tx.delete(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
    await tx.update(communities).set({ memberCount: sql`greatest(${communities.memberCount} - 1, 0)` }).where(eq(communities.id, communityId));
  });
}

async function listMembers(communityId: string) {
  return db
    .select({ userId: users.id, name: users.name, email: users.email, image: users.image, role: communityMembers.role, joinedAt: communityMembers.joinedAt })
    .from(communityMembers)
    .innerJoin(users, eq(users.id, communityMembers.userId))
    .where(eq(communityMembers.communityId, communityId))
    .orderBy(communityMembers.joinedAt);
}

// Only the OWNER can promote/demote — a MODERATOR can't create peer moderators, and
// nobody (including the owner) changes the OWNER role itself; ownership transfer isn't
// a v1 feature. Platform ADMIN/SUPER_ADMIN bypass the OWNER requirement, same override
// every other moderation action here gets — see removeMember below.
async function updateMemberRole(communityId: string, actorUserId: string, actorRole: UserRole, targetUserId: string, role: 'MODERATOR' | 'MEMBER') {
  const actor = await getMembership(communityId, actorUserId);
  if (actor?.role !== 'OWNER' && !isAdmin(actorRole)) throw new Error('FORBIDDEN');
  const target = await getMembership(communityId, targetUserId);
  if (!target) throw new Error('NOT_FOUND');
  if (target.role === 'OWNER') throw new Error('CANNOT_DEMOTE_OWNER');

  await db.update(communityMembers).set({ role }).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, targetUserId)));
}

// MODERATORs can remove plain MEMBERs; only the OWNER can remove a MODERATOR. Nobody can
// remove the OWNER (they'd have to archive the community instead). Platform ADMIN/
// SUPER_ADMIN bypass all of this, including not needing a membership row at all — the
// `!platformAdmin` guard has to short-circuit the "no membership" check too, not just the
// "MEMBER role" check, or an admin who never joined the community stays locked out.
async function removeMember(communityId: string, actorUserId: string, actorRole: UserRole, targetUserId: string) {
  const actorMembership = await getMembership(communityId, actorUserId);
  const platformAdmin = isAdmin(actorRole);
  if (!platformAdmin && (!actorMembership || actorMembership.role === 'MEMBER')) throw new Error('FORBIDDEN');

  const target = await getMembership(communityId, targetUserId);
  if (!target) throw new Error('NOT_FOUND');
  if (target.role === 'OWNER') throw new Error('CANNOT_REMOVE_OWNER');
  if (target.role === 'MODERATOR' && actorMembership?.role !== 'OWNER' && !platformAdmin) throw new Error('FORBIDDEN');

  await db.transaction(async (tx) => {
    await tx.delete(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, targetUserId)));
    await tx.update(communities).set({ memberCount: sql`greatest(${communities.memberCount} - 1, 0)` }).where(eq(communities.id, communityId));
  });
}

// ── Posts ────────────────────────────────────────────────────────────────────

async function createPost(communityId: string, authorId: string, input: { body: string; imageUrl?: string }) {
  if (!(await getMembership(communityId, authorId))) throw new Error('NOT_A_MEMBER');

  let id = 0;
  await db.transaction(async (tx) => {
    const [result] = await tx.insert(communityPosts).values({ communityId, authorId, body: input.body, imageUrl: input.imageUrl });
    id = result.insertId;
    await tx.update(communities).set({ postCount: sql`${communities.postCount} + 1` }).where(eq(communities.id, communityId));
  });
  return getPost(id);
}

async function getPost(postId: number) {
  const [row] = await db
    .select({ post: communityPosts, authorName: users.name, authorImage: users.image })
    .from(communityPosts)
    .innerJoin(users, eq(users.id, communityPosts.authorId))
    .where(and(eq(communityPosts.id, postId), eq(communityPosts.status, 'PUBLISHED')))
    .limit(1);
  if (!row) return null;
  return { ...row.post, authorName: row.authorName, authorImage: row.authorImage };
}

async function listPosts(communityId: string, opts: { limit?: number; cursor?: number } = {}) {
  const limit = Math.min(opts.limit ?? 20, 50);
  const conditions = [eq(communityPosts.communityId, communityId), eq(communityPosts.status, 'PUBLISHED')];
  if (opts.cursor) conditions.push(sql`${communityPosts.id} < ${opts.cursor}`);

  const rows = await db
    .select({ post: communityPosts, authorName: users.name, authorImage: users.image })
    .from(communityPosts)
    .innerJoin(users, eq(users.id, communityPosts.authorId))
    .where(and(...conditions))
    .orderBy(desc(communityPosts.isPinned), desc(communityPosts.id))
    .limit(limit);

  return rows.map((r) => ({ ...r.post, authorName: r.authorName, authorImage: r.authorImage }));
}

async function updatePost(postId: number, authorId: string, input: { body: string; imageUrl?: string }) {
  const post = await getPost(postId);
  if (!post) throw new Error('NOT_FOUND');
  if (post.authorId !== authorId) throw new Error('FORBIDDEN');

  await db.update(communityPosts).set({ body: input.body, imageUrl: input.imageUrl, updatedAt: new Date() }).where(eq(communityPosts.id, postId));
  return getPost(postId);
}

// Soft delete — author can remove their own post, a MODERATOR+/platform admin can remove
// anyone's. Row stays (comment_count/history intact) but every read path filters on
// status='PUBLISHED'.
async function removePost(postId: number, actorUserId: string, actorRole: UserRole) {
  const [row] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (!row || row.status !== 'PUBLISHED') throw new Error('NOT_FOUND');

  if (row.authorId !== actorUserId) {
    const membership = await getMembership(row.communityId, actorUserId);
    if (membership?.role === 'MEMBER' || (!membership && !isAdmin(actorRole))) throw new Error('FORBIDDEN');
  }

  await db.transaction(async (tx) => {
    await tx.update(communityPosts).set({ status: 'REMOVED' }).where(eq(communityPosts.id, postId));
    await tx.update(communities).set({ postCount: sql`greatest(${communities.postCount} - 1, 0)` }).where(eq(communities.id, row.communityId));
  });
}

async function setPinned(postId: number, actorUserId: string, actorRole: UserRole, pinned: boolean) {
  const [row] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (!row || row.status !== 'PUBLISHED') throw new Error('NOT_FOUND');

  const membership = await getMembership(row.communityId, actorUserId);
  if (membership?.role === 'MEMBER' || (!membership && !isAdmin(actorRole))) throw new Error('FORBIDDEN');

  if (pinned) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityPosts)
      .where(and(eq(communityPosts.communityId, row.communityId), eq(communityPosts.isPinned, true)));
    if (count >= COMMUNITY_LIMITS.MAX_PINNED_POSTS) throw new Error('PIN_LIMIT_REACHED');
  }

  await db.update(communityPosts).set({ isPinned: pinned }).where(eq(communityPosts.id, postId));
}

// ── Comments ─────────────────────────────────────────────────────────────────

async function createComment(postId: number, authorId: string, input: { body: string; parentCommentId?: number }) {
  const post = await getPost(postId);
  if (!post) throw new Error('NOT_FOUND');
  if (!(await getMembership(post.communityId, authorId))) throw new Error('NOT_A_MEMBER');

  let parent: { authorId: string } | undefined;
  if (input.parentCommentId) {
    const [parentRow] = await db
      .select({ postId: communityPostComments.postId, parentCommentId: communityPostComments.parentCommentId, authorId: communityPostComments.authorId })
      .from(communityPostComments)
      .where(eq(communityPostComments.id, input.parentCommentId))
      .limit(1);
    // One level deep only: a reply's parent must itself be a top-level comment on this
    // same post — replying to a reply is rejected rather than silently re-parented.
    if (!parentRow || parentRow.postId !== postId || parentRow.parentCommentId !== null) throw new Error('INVALID_PARENT_COMMENT');
    parent = parentRow;
  }

  let id = 0;
  await db.transaction(async (tx) => {
    const [result] = await tx.insert(communityPostComments).values({ postId, authorId, body: input.body, parentCommentId: input.parentCommentId });
    id = result.insertId;
    await tx.update(communityPosts).set({ commentCount: sql`${communityPosts.commentCount} + 1` }).where(eq(communityPosts.id, postId));
  });

  // Notify: a reply notifies the parent comment's author; a top-level comment notifies the
  // post's author. Never notify yourself. Best-effort — a failure here shouldn't fail the
  // comment itself, but there's nothing async/flaky about a same-transaction-adjacent
  // insert on the same DB, so no try/catch is added (matches the rest of this file's style
  // of letting genuine errors surface).
  if (parent) {
    if (parent.authorId !== authorId) {
      await createNotification({ recipientUserId: parent.authorId, actorUserId: authorId, type: 'COMMENT_REPLY', communityId: post.communityId, postId, commentId: id });
    }
  } else if (post.authorId !== authorId) {
    await createNotification({ recipientUserId: post.authorId, actorUserId: authorId, type: 'POST_COMMENT', communityId: post.communityId, postId, commentId: id });
  }

  const [row] = await db
    .select({ comment: communityPostComments, authorName: users.name, authorImage: users.image })
    .from(communityPostComments)
    .innerJoin(users, eq(users.id, communityPostComments.authorId))
    .where(eq(communityPostComments.id, id))
    .limit(1);
  return { ...row.comment, authorName: row.authorName, authorImage: row.authorImage };
}

async function listComments(postId: number) {
  const rows = await db
    .select({ comment: communityPostComments, authorName: users.name, authorImage: users.image })
    .from(communityPostComments)
    .innerJoin(users, eq(users.id, communityPostComments.authorId))
    .where(and(eq(communityPostComments.postId, postId), eq(communityPostComments.status, 'PUBLISHED')))
    .orderBy(communityPostComments.id);
  return rows.map((r) => ({ ...r.comment, authorName: r.authorName, authorImage: r.authorImage }));
}

// Deletable by: the comment's own author, a MODERATOR+ of the comment's community, a
// platform admin, OR (additive — see project decision) the AUTHOR OF THE POST the comment
// is on, even if they're a plain MEMBER of the community and didn't write the comment.
async function removeComment(commentId: number, actorUserId: string, actorRole: UserRole) {
  const [row] = await db.select().from(communityPostComments).where(eq(communityPostComments.id, commentId)).limit(1);
  if (!row || row.status !== 'PUBLISHED') throw new Error('NOT_FOUND');

  if (row.authorId !== actorUserId) {
    const post = await getPost(row.postId);
    if (post?.authorId !== actorUserId) {
      const membership = post ? await getMembership(post.communityId, actorUserId) : null;
      if (membership?.role === 'MEMBER' || (!membership && !isAdmin(actorRole))) throw new Error('FORBIDDEN');
    }
  }

  await db.transaction(async (tx) => {
    await tx.update(communityPostComments).set({ status: 'REMOVED' }).where(eq(communityPostComments.id, commentId));
    await tx.update(communityPosts).set({ commentCount: sql`greatest(${communityPosts.commentCount} - 1, 0)` }).where(eq(communityPosts.id, row.postId));
  });
}

// ── Votes (up/down) ──────────────────────────────────────────────────────────

// Signed vote: value is 1 (up) or -1 (down). Voting the same value again un-votes;
// voting the opposite value flips it. Only POST keeps a denormalized net-score column
// (feed sorting needs it); COMMENT scores are computed via SUM(value) on read (see
// commentScores below) — same "no write-hot column at comment-list scale" tradeoff as
// before this was signed.
async function voteOnPost(postId: number, userId: string, value: 1 | -1) {
  const post = await getPost(postId);
  if (!post) throw new Error('NOT_FOUND');
  if (!(await getMembership(post.communityId, userId))) throw new Error('NOT_A_MEMBER');

  const [existing] = await db
    .select()
    .from(communityReactions)
    .where(and(eq(communityReactions.userId, userId), eq(communityReactions.targetType, 'POST'), eq(communityReactions.targetId, postId)))
    .limit(1);

  await db.transaction(async (tx) => {
    if (!existing) {
      await tx.insert(communityReactions).values({ userId, targetType: 'POST', targetId: postId, value });
      await tx.update(communityPosts).set({ upvoteCount: sql`${communityPosts.upvoteCount} + ${value}` }).where(eq(communityPosts.id, postId));
    } else if (existing.value === value) {
      await tx
        .delete(communityReactions)
        .where(and(eq(communityReactions.userId, userId), eq(communityReactions.targetType, 'POST'), eq(communityReactions.targetId, postId)));
      await tx.update(communityPosts).set({ upvoteCount: sql`${communityPosts.upvoteCount} - ${value}` }).where(eq(communityPosts.id, postId));
    } else {
      await tx
        .update(communityReactions)
        .set({ value })
        .where(and(eq(communityReactions.userId, userId), eq(communityReactions.targetType, 'POST'), eq(communityReactions.targetId, postId)));
      await tx.update(communityPosts).set({ upvoteCount: sql`${communityPosts.upvoteCount} + ${2 * value}` }).where(eq(communityPosts.id, postId));
    }
  });
  return { myVote: existing?.value === value ? null : value };
}

async function voteOnComment(commentId: number, userId: string, value: 1 | -1) {
  const [comment] = await db.select().from(communityPostComments).where(eq(communityPostComments.id, commentId)).limit(1);
  if (!comment || comment.status !== 'PUBLISHED') throw new Error('NOT_FOUND');
  const post = await getPost(comment.postId);
  if (!post || !(await getMembership(post.communityId, userId))) throw new Error('NOT_A_MEMBER');

  const [existing] = await db
    .select()
    .from(communityReactions)
    .where(and(eq(communityReactions.userId, userId), eq(communityReactions.targetType, 'COMMENT'), eq(communityReactions.targetId, commentId)))
    .limit(1);

  if (!existing) {
    await db.insert(communityReactions).values({ userId, targetType: 'COMMENT', targetId: commentId, value });
  } else if (existing.value === value) {
    await db
      .delete(communityReactions)
      .where(and(eq(communityReactions.userId, userId), eq(communityReactions.targetType, 'COMMENT'), eq(communityReactions.targetId, commentId)));
  } else {
    await db
      .update(communityReactions)
      .set({ value })
      .where(and(eq(communityReactions.userId, userId), eq(communityReactions.targetType, 'COMMENT'), eq(communityReactions.targetId, commentId)));
  }
  return { myVote: existing?.value === value ? null : value };
}

async function commentScores(commentIds: number[]): Promise<Map<number, number>> {
  if (commentIds.length === 0) return new Map();
  const rows = await db
    .select({ targetId: communityReactions.targetId, score: sql<number>`coalesce(sum(${communityReactions.value}), 0)` })
    .from(communityReactions)
    .where(and(eq(communityReactions.targetType, 'COMMENT'), inArray(communityReactions.targetId, commentIds)))
    .groupBy(communityReactions.targetId);
  return new Map(rows.map((r) => [r.targetId, Number(r.score)]));
}

/** Map of targetId -> the caller's current vote (1 or -1), only for targets they've voted on. */
async function userVotes(userId: string | null, targetType: 'POST' | 'COMMENT', targetIds: number[]): Promise<Map<number, 1 | -1>> {
  if (!userId || targetIds.length === 0) return new Map();
  const rows = await db
    .select({ targetId: communityReactions.targetId, value: communityReactions.value })
    .from(communityReactions)
    .where(and(eq(communityReactions.userId, userId), eq(communityReactions.targetType, targetType), inArray(communityReactions.targetId, targetIds)));
  return new Map(rows.map((r) => [r.targetId, r.value as 1 | -1]));
}

// ── Notifications ────────────────────────────────────────────────────────────

async function createNotification(input: { recipientUserId: string; actorUserId: string; type: 'POST_COMMENT' | 'COMMENT_REPLY'; communityId: string; postId: number; commentId: number }) {
  await db.insert(communityNotifications).values(input);
}

async function listNotifications(userId: string, opts: { limit?: number; cursor?: number } = {}) {
  const limit = Math.min(opts.limit ?? 20, 50);
  const conditions = [eq(communityNotifications.recipientUserId, userId)];
  if (opts.cursor) conditions.push(sql`${communityNotifications.id} < ${opts.cursor}`);

  return db
    .select({
      notification: communityNotifications,
      actorName: users.name,
      actorImage: users.image,
      communitySlug: communities.slug,
    })
    .from(communityNotifications)
    .innerJoin(users, eq(users.id, communityNotifications.actorUserId))
    .innerJoin(communities, eq(communities.id, communityNotifications.communityId))
    .where(and(...conditions))
    .orderBy(desc(communityNotifications.id))
    .limit(limit)
    .then((rows) => rows.map((r) => ({ ...r.notification, actorName: r.actorName, actorImage: r.actorImage, communitySlug: r.communitySlug })));
}

async function unreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(communityNotifications)
    .where(and(eq(communityNotifications.recipientUserId, userId), eq(communityNotifications.read, false)));
  return row?.count ?? 0;
}

async function markNotificationRead(id: number, userId: string) {
  await db.update(communityNotifications).set({ read: true }).where(and(eq(communityNotifications.id, id), eq(communityNotifications.recipientUserId, userId)));
}

async function markAllNotificationsRead(userId: string) {
  await db.update(communityNotifications).set({ read: true }).where(and(eq(communityNotifications.recipientUserId, userId), eq(communityNotifications.read, false)));
}

// ── Search ───────────────────────────────────────────────────────────────────

// Posts matching `query` (body LIKE) across every community the caller can view — mirrors
// findVisibleToUser's PUBLIC-or-member visibility rule rather than duplicating it via a
// join, since post visibility is entirely inherited from its community's visibility.
async function searchPosts(query: string, userId: string | null, role: UserRole | null, limit = 20) {
  const visibleCommunityIds = (await findVisibleToUser(userId, role)).map((c) => c.id);
  if (visibleCommunityIds.length === 0) return [];

  const rows = await db
    .select({ post: communityPosts, authorName: users.name, authorImage: users.image, communitySlug: communities.slug, communityName: communities.name })
    .from(communityPosts)
    .innerJoin(users, eq(users.id, communityPosts.authorId))
    .innerJoin(communities, eq(communities.id, communityPosts.communityId))
    .where(
      and(
        eq(communityPosts.status, 'PUBLISHED'),
        inArray(communityPosts.communityId, visibleCommunityIds),
        sql`${communityPosts.body} LIKE ${`%${query}%`}`,
      ),
    )
    .orderBy(desc(communityPosts.id))
    .limit(Math.min(limit, 50));

  return rows.map((r) => ({ ...r.post, authorName: r.authorName, authorImage: r.authorImage, communitySlug: r.communitySlug, communityName: r.communityName }));
}

// Recent posts across every community the caller can view — powers the Communities Home
// "Recent activity" feed (a real feed, replacing the design mockup's fabricated one).
async function listRecentPostsAcrossVisible(userId: string | null, role: UserRole | null, limit = 10) {
  const visibleCommunityIds = (await findVisibleToUser(userId, role)).map((c) => c.id);
  if (visibleCommunityIds.length === 0) return [];

  const rows = await db
    .select({ post: communityPosts, authorName: users.name, authorImage: users.image, communitySlug: communities.slug, communityName: communities.name })
    .from(communityPosts)
    .innerJoin(users, eq(users.id, communityPosts.authorId))
    .innerJoin(communities, eq(communities.id, communityPosts.communityId))
    .where(and(eq(communityPosts.status, 'PUBLISHED'), inArray(communityPosts.communityId, visibleCommunityIds)))
    .orderBy(desc(communityPosts.id))
    .limit(Math.min(limit, 50));

  return rows.map((r) => ({ ...r.post, authorName: r.authorName, authorImage: r.authorImage, communitySlug: r.communitySlug, communityName: r.communityName }));
}

export const communityRepository = {
  createCommunity,
  updateCommunity,
  archiveCommunity,
  findById,
  findBySlug,
  getMembership,
  canView,
  findVisibleToUser,
  listMine,
  listMineWithActivity,
  join,
  addMember,
  leave,
  listMembers,
  updateMemberRole,
  removeMember,
  createPost,
  getPost,
  listPosts,
  updatePost,
  removePost,
  setPinned,
  createComment,
  listComments,
  removeComment,
  voteOnPost,
  voteOnComment,
  commentScores,
  userVotes,
  listNotifications,
  unreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  searchPosts,
  listRecentPostsAcrossVisible,
};
