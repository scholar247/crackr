import { z } from 'zod';
import { USER_ROLES } from '@/lib/roles';
import { PREP_LEVELS } from '@/lib/prep-level';

export const USER_STATUS_VALUES = ['ACTIVE', 'DISABLED'] as const;

// Deliberately no `email` field — email is the login identity and must stay admin-immutable.
export const UpdateUserSchema = z.object({
  name: z.string().max(255).optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUS_VALUES).optional(),
  targetYear: z.number().int().optional(),
  level: z.enum(PREP_LEVELS).optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
