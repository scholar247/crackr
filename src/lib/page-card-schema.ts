import { z } from 'zod';
import { HOME_CARD_ACCENTS, HOME_CARD_CTA_TYPES } from '@/server/db/schema/home';

const slugLike = z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes');

// A CTA needs both a label and a link, or neither.
export const PageCardSchema = z
  .object({
    page: slugLike,
    section: slugLike,
    sequence: z.number().int().min(0).max(1000),
    title: z.string().min(1).max(160),
    badge: z.string().max(60).nullish(),
    description: z.string().max(1000).nullish(),
    listItems: z.array(z.string().min(1).max(200)).max(12).nullish(),
    ctaLabel: z.string().max(80).nullish(),
    // Internal path or absolute http(s) URL only — no javascript: links.
    ctaLink: z
      .string()
      .max(2048)
      .regex(/^(\/|https?:\/\/)/, 'Link must start with / or http(s)://')
      .nullish(),
    ctaType: z.enum(HOME_CARD_CTA_TYPES),
    accent: z.enum(HOME_CARD_ACCENTS),
    isActive: z.boolean(),
  })
  .refine((v) => !!v.ctaLabel === !!v.ctaLink, { message: 'CTA needs both a label and a link', path: ['ctaLink'] });
