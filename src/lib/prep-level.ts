// Single source of truth for the prep-level enum — mirrors src/lib/roles.ts's pattern
// (schema builds its mysql enum from this list rather than duplicating it). Framework
// agnostic and safe to import from client components (the onboarding form).

export const PREP_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type PrepLevel = (typeof PREP_LEVELS)[number];

export const PREP_LEVEL_LABELS: Record<PrepLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};
