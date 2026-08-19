// Single source of truth for mock/group-test/challenge validation bounds — embedded into
// every creation Zod schema (self-mock.schema.ts, group-test.schema.ts, challenge.schema.ts)
// so the limits can't drift between them.

export const ASSESSMENT_LIMITS = {
  MIN_SECTIONS: 1,
  MAX_SECTIONS: 20,
  MIN_QUESTIONS_PER_SECTION: 1,
  MAX_QUESTIONS_PER_SECTION: 100,
  MIN_TOTAL_QUESTIONS: 5,
  MAX_TOTAL_QUESTIONS: 300,
  MIN_DURATION_MINUTES: 5,
  MAX_DURATION_MINUTES: 480,
  MAX_MARKS: 100,
  MAX_INVITES_PER_REQUEST: 500,
  MAX_ATTEMPTS_CAP: 10,
  MAX_STUDENT_INSTRUCTIONS_LENGTH: 4000,
  MAX_TAGS: 10,
  MAX_TAG_LENGTH: 40,
  MAX_BANNER_IMAGE_URL_LENGTH: 2048,
} as const;
