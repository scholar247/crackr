// Single source of truth for community/post/comment validation bounds — mirrors
// src/lib/assessment-limits.ts's role for the mocks module.

export const COMMUNITY_LIMITS = {
  NAME_MIN: 3,
  NAME_MAX: 80,
  DESCRIPTION_MAX: 1000,
  POST_BODY_MIN: 1,
  POST_BODY_MAX: 10000,
  COMMENT_BODY_MIN: 1,
  COMMENT_BODY_MAX: 3000,
  // Beyond this, "pinned" stops meaning anything — enforced when a moderator pins a
  // new post, not a DB constraint.
  MAX_PINNED_POSTS: 3,
} as const;
