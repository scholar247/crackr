import { z } from 'zod';
import { ASSESSMENT_LIMITS } from '@/lib/assessment-limits';
import { AssessmentSectionSchema } from './self-mock.schema';

export const CreateGroupTestSchema = z
  .object({
    title: z.string().min(3).max(160),
    description: z.string().max(2000).optional(),
    examId: z.uuid(),
    sections: z.array(AssessmentSectionSchema).min(ASSESSMENT_LIMITS.MIN_SECTIONS).max(ASSESSMENT_LIMITS.MAX_SECTIONS),
    durationMinutes: z.number().int().min(ASSESSMENT_LIMITS.MIN_DURATION_MINUTES).max(ASSESSMENT_LIMITS.MAX_DURATION_MINUTES),
    maxAttempts: z.number().int().min(1).max(ASSESSMENT_LIMITS.MAX_ATTEMPTS_CAP).optional(),
    // FIXED: everyone starts at the same instant (startsAt/endsAt is that exact shared
    // window). FLEXIBLE: startsAt/endsAt is an outer window each participant can start
    // any time inside, getting the full duration from their own start.
    schedulingMode: z.enum(['FIXED', 'FLEXIBLE']),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    emails: z.array(z.email()).max(ASSESSMENT_LIMITS.MAX_INVITES_PER_REQUEST).optional(),
    audienceIds: z.array(z.uuid()).max(ASSESSMENT_LIMITS.MAX_INVITES_PER_REQUEST).optional(),
  })
  .refine(
    (data) => {
      const total = data.sections.reduce((sum, s) => sum + s.questionCount, 0);
      return total >= ASSESSMENT_LIMITS.MIN_TOTAL_QUESTIONS && total <= ASSESSMENT_LIMITS.MAX_TOTAL_QUESTIONS;
    },
    { message: `Total questions across all sections must be between ${ASSESSMENT_LIMITS.MIN_TOTAL_QUESTIONS} and ${ASSESSMENT_LIMITS.MAX_TOTAL_QUESTIONS}` }
  )
  .refine((data) => (data.emails?.length ?? 0) + (data.audienceIds?.length ?? 0) > 0, { message: 'Invite at least one person or group' })
  .refine((data) => !Number.isNaN(new Date(data.startsAt).getTime()) && !Number.isNaN(new Date(data.endsAt).getTime()), { message: 'Invalid start/end date' })
  .refine((data) => new Date(data.startsAt).getTime() < new Date(data.endsAt).getTime(), { message: 'Start time must be before end time', path: ['endsAt'] });
export type CreateGroupTestInput = z.infer<typeof CreateGroupTestSchema>;

export const AddInvitesSchema = z
  .object({
    emails: z.array(z.email()).max(ASSESSMENT_LIMITS.MAX_INVITES_PER_REQUEST).optional(),
    audienceIds: z.array(z.uuid()).max(ASSESSMENT_LIMITS.MAX_INVITES_PER_REQUEST).optional(),
  })
  .refine((data) => (data.emails?.length ?? 0) + (data.audienceIds?.length ?? 0) > 0, { message: 'Invite at least one person or group' });
