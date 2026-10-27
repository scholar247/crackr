import { z } from 'zod';
import { PREP_LEVELS } from '@/lib/prep-level';

// Self-service profile update — deliberately no `email`, `role`, or `status`. Email is
// the login identity (same immutability rule as UpdateUserSchema); role/status are
// admin-only fields that must never be reachable from a route a student can call on
// themselves (unlike UpdateUserSchema, which is fine for the admin route to include them).
export const UpdateProfileSchema = z.object({
  name: z.string().max(255).optional(),
  college: z.string().max(255).optional(),
  degree: z.string().max(255).optional(),
  passingYear: z.number().int().min(1950).max(2100).optional(),
  targetYear: z.number().int().optional(),
  level: z.enum(PREP_LEVELS).optional(),
  targetProgramId: z.string().uuid().optional(),
  // Exam targets are updated together: submitting examIds without a primaryExamId (or
  // vice versa) is rejected below rather than silently leaving the flag inconsistent.
  examIds: z.array(z.string().uuid()).optional(),
  primaryExamId: z.string().uuid().optional(),
}).refine((data) => !(data.examIds && data.examIds.length > 0 && !data.primaryExamId), {
  message: 'primaryExamId is required when updating examIds',
  path: ['primaryExamId'],
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
