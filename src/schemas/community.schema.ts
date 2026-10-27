import { z } from 'zod';
import { COMMUNITY_LIMITS } from '@/lib/community-limits';

// kind/examId/programId are deliberately NOT here — kind is decided server-side from the
// caller's role (see POST /api/v1/communities), never trusted from the client, and
// examId/programId only apply to OFFICIAL communities so they travel as a separate
// optional payload the route only reads when it has already confirmed ADMIN+.
export const CreateCommunitySchema = z.object({
  name: z.string().min(COMMUNITY_LIMITS.NAME_MIN).max(COMMUNITY_LIMITS.NAME_MAX),
  description: z.string().max(COMMUNITY_LIMITS.DESCRIPTION_MAX).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  bannerImage: z.url().max(2048).optional(),
  examId: z.uuid().optional(),
  programId: z.uuid().optional(),
});
export type CreateCommunityInput = z.infer<typeof CreateCommunitySchema>;

export const UpdateCommunitySchema = z.object({
  name: z.string().min(COMMUNITY_LIMITS.NAME_MIN).max(COMMUNITY_LIMITS.NAME_MAX).optional(),
  description: z.string().max(COMMUNITY_LIMITS.DESCRIPTION_MAX).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  bannerImage: z.url().max(2048).optional(),
});
export type UpdateCommunityInput = z.infer<typeof UpdateCommunitySchema>;

export const CreatePostSchema = z.object({
  body: z.string().min(COMMUNITY_LIMITS.POST_BODY_MIN).max(COMMUNITY_LIMITS.POST_BODY_MAX),
  imageUrl: z.url().max(2048).optional(),
});
export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const CreateCommentSchema = z.object({
  body: z.string().min(COMMUNITY_LIMITS.COMMENT_BODY_MIN).max(COMMUNITY_LIMITS.COMMENT_BODY_MAX),
  parentCommentId: z.number().int().positive().optional(),
});
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['MODERATOR', 'MEMBER']),
});

export const AddMemberSchema = z.object({
  email: z.email(),
});
