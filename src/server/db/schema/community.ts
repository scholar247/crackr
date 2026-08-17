import { mysqlTable, mysqlEnum, varchar, text, int, bigint, boolean, tinyint, timestamp, primaryKey, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { users } from './identity';
import { programs, exams } from './taxonomy';

// Backs the community/discussion platform — see src/server/repositories/community.repository.ts.

// OFFICIAL communities are the canonical per-exam hub (creatable only by ADMIN+, capped at
// one per exam — enforced in the repository, not the DB: MySQL has no partial/filtered
// unique index, so "examId must be unique only among OFFICIAL rows" can't be a constraint
// here the way it could in Postgres). USER_CREATED is the open "anyone can start one" tier.
const COMMUNITY_KINDS = ['OFFICIAL', 'USER_CREATED'] as const;
// PRIVATE communities are hidden from non-members (feed, member list, everything) rather
// than just gating posting — same all-or-nothing shape as assessments' PRIVATE visibility.
const COMMUNITY_VISIBILITIES = ['PUBLIC', 'PRIVATE'] as const;
const COMMUNITY_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;
// A MEMBER row doubles as "follows this community" — there's no separate follow relation
// (see the plan's "collapse follow into join" decision). OWNER is the creator (exactly one,
// never demoted below MODERATOR by another moderator); MODERATOR can pin/remove
// posts/comments and remove members but not archive the community or change its settings.
const COMMUNITY_MEMBER_ROLES = ['OWNER', 'MODERATOR', 'MEMBER'] as const;
// Soft-delete for posts/comments — REMOVED rows stay in place (preserves comment_count /
// reply structure) but are filtered out of every read path, same reasoning as assessments
// never hard-deleting a PUBLISHED row.
const MODERATION_STATUSES = ['PUBLISHED', 'REMOVED'] as const;
const REACTION_TARGET_TYPES = ['POST', 'COMMENT'] as const;
const NOTIFICATION_TYPES = ['POST_COMMENT', 'COMMENT_REPLY'] as const;

export const communities = mysqlTable(
  'communities',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    slug: varchar('slug', { length: 200 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    description: text('description'),
    kind: mysqlEnum('kind', COMMUNITY_KINDS).notNull().default('USER_CREATED'),
    visibility: mysqlEnum('visibility', COMMUNITY_VISIBILITIES).notNull().default('PUBLIC'),
    status: mysqlEnum('status', COMMUNITY_STATUSES).notNull().default('ACTIVE'),
    // Direct nullable FKs rather than a community_exam_map join table — a community maps
    // to at most one exam/program in practice (unlike questions/articles, which can be
    // tagged across many). Both null = a general-topic community, not tied to a syllabus.
    programId: varchar('program_id', { length: 36 }).references(() => programs.id, { onDelete: 'set null' }),
    examId: varchar('exam_id', { length: 36 }).references(() => exams.id, { onDelete: 'set null' }),
    bannerImage: varchar('banner_image', { length: 2048 }),
    creatorUserId: varchar('creator_user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // Denormalized, kept in sync inside the same transaction as the membership/post write
    // that changes them — avoids a COUNT(*) over community_members/community_posts on
    // every community-list render.
    memberCount: int('member_count').notNull().default(1),
    postCount: int('post_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('communities_slug_idx').on(table.slug)],
);

export const communityMembers = mysqlTable(
  'community_members',
  {
    communityId: varchar('community_id', { length: 36 })
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: mysqlEnum('role', COMMUNITY_MEMBER_ROLES).notNull().default('MEMBER'),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.communityId, table.userId] })],
);

export const communityPosts = mysqlTable('community_posts', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  communityId: varchar('community_id', { length: 36 })
    .notNull()
    .references(() => communities.id, { onDelete: 'cascade' }),
  authorId: varchar('author_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(), // markdown, rendered by src/components/blog/blog-content.tsx
  imageUrl: varchar('image_url', { length: 2048 }),
  status: mysqlEnum('status', MODERATION_STATUSES).notNull().default('PUBLISHED'),
  isPinned: boolean('is_pinned').notNull().default(false),
  // Net score (sum of communityReactions.value, +1/-1 per voter) — column name kept as
  // upvoteCount to avoid a rename migration even though it can go negative now that
  // downvotes exist.
  upvoteCount: int('upvote_count').notNull().default(0),
  commentCount: int('comment_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const communityPostComments = mysqlTable('community_post_comments', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  postId: bigint('post_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => communityPosts.id, { onDelete: 'cascade' }),
  authorId: varchar('author_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // One level deep only (top-level comment vs. reply-to-a-top-level-comment) — enforced in
  // the repository by rejecting a reply whose parent itself has a parentCommentId, not by a
  // DB constraint. Left as a plain column (no FK) to avoid a same-table self-reference,
  // which Drizzle's MySQL dialect handles awkwardly; the repository validates postId match
  // before insert instead.
  parentCommentId: bigint('parent_comment_id', { mode: 'number', unsigned: true }),
  body: text('body').notNull(),
  status: mysqlEnum('status', MODERATION_STATUSES).notNull().default('PUBLISHED'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Polymorphic target (a post or a comment) — no FK constraint possible for that, same
// tradeoff as content_node_map.contentId (see content.ts).
export const communityReactions = mysqlTable(
  'community_reactions',
  {
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: mysqlEnum('target_type', REACTION_TARGET_TYPES).notNull(),
    targetId: bigint('target_id', { mode: 'number', unsigned: true }).notNull(),
    // +1 (upvote) or -1 (downvote), never 0 — a repeat vote of the same value un-votes
    // (row deleted) rather than being stored as 0; see voteOnTarget in the repository.
    value: tinyint('value').notNull().default(1),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.targetType, table.targetId] })],
);

export const communityNotifications = mysqlTable(
  'community_notifications',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    recipientUserId: varchar('recipient_user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    actorUserId: varchar('actor_user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: mysqlEnum('type', NOTIFICATION_TYPES).notNull(),
    communityId: varchar('community_id', { length: 36 })
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    postId: bigint('post_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    // The comment/reply that triggered this notification — no FK, same self-reference
    // tradeoff as communityPostComments.parentCommentId.
    commentId: bigint('comment_id', { mode: 'number', unsigned: true }).notNull(),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('community_notifications_recipient_idx').on(table.recipientUserId, table.read, table.id)],
);
