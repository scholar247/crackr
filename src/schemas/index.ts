import { z } from 'zod';
import { AIGenerationMetaSchema } from './blog.schema';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'EDITOR', 'REVIEWER', 'STUDENT']);
export const MCQStatusSchema = z.enum(['DRAFT', 'PENDING', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED']);
export const DifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']);
export const DifficultyMixedSchema = z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED']);
export const QuestionTypeSchema = z.enum(['SINGLE', 'MULTIPLE']);
export const ContentBlockTypeSchema = z.enum(['TEXT', 'MATH', 'CHEMISTRY', 'IMAGE', 'AUDIO', 'VIDEO']);
export const TestAccessTypeSchema = z.enum(['ALL', 'USERS', 'GROUPS']);
export const ShowExplanationSchema = z.enum(['NEVER', 'AFTER_SUBMIT', 'AFTER_DEADLINE']);
export const TestStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const AttemptStatusSchema = z.enum(['IN_PROGRESS', 'SUBMITTED', 'EVALUATED']);
export const ExamCategorySchema = z.enum(['ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'BANKING', 'GOVERNMENT', 'SCHOOL', 'OTHER']);
export const DifficultyProfileSchema = z.enum(['EASY', 'MEDIUM', 'HARD', 'MIXED']);

// ─── Content Block ────────────────────────────────────────────────────────────

export const ContentBlockSchema = z.object({
  type: ContentBlockTypeSchema,
  content: z.string().min(1, 'Content cannot be empty'),
  altText: z.string().optional(),
});

// ─── MCQ Option ───────────────────────────────────────────────────────────────

export const MCQOptionSchema = z.object({
  id: z.string().min(1),
  content: z.array(ContentBlockSchema).min(1, 'Option must have content'),
  isCorrect: z.boolean(),
});

// ─── Subject ──────────────────────────────────────────────────────────────────

export const CreateSubjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  shortName: z.string().max(20).default(''),
  description: z.string().max(500).optional(),
  iconName: z.string().min(1, 'Icon name is required'),
  color: z.string().min(1, 'Color is required'),
  isActive: z.boolean().default(true),
});

export const UpdateSubjectSchema = CreateSubjectSchema.partial();

// ─── Topic (replaces Category) ────────────────────────────────────────────────

export const CreateTopicSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  subjectId: z.string().min(1, 'Subject is required'),
  parentId: z.string().nullable().default(null),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0).default(0),
});

export const UpdateTopicSchema = CreateTopicSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const MoveTopicSchema = z.object({
  newParentId: z.string().nullable(),
});

export const ReorderTopicsSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

// ─── Exam ─────────────────────────────────────────────────────────────────────

export const CreateExamSchema = z.object({
  name: z.string().min(2).max(100),
  fullName: z.string().min(2).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  category: ExamCategorySchema,
  conductedBy: z.string().min(1),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  officialWebsite: z.string().url().optional().or(z.literal('')),
  subjectIds: z.array(z.string()).min(1, 'At least one subject required'),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const UpdateExamSchema = CreateExamSchema.partial();

// ─── Exam Section ─────────────────────────────────────────────────────────────

export const CreateExamSectionSchema = z.object({
  examId: z.string().min(1),
  subjectId: z.string().min(1),
  topicId: z.string().min(1),
  displayName: z.string().max(200).optional(),
  weightage: z.number().min(0).max(100).optional(),
  difficultyProfile: DifficultyProfileSchema.default('MIXED'),
  syllabusNotes: z.string().max(500).optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateExamSectionSchema = CreateExamSectionSchema.partial();

// ─── MCQ Create/Update ────────────────────────────────────────────────────────

const MCQBaseSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  topicId: z.string().min(1, 'Topic is required'),
  examIds: z.array(z.string()).min(1, 'At least one exam required'),
  examSectionIds: z.array(z.string()).default([]),
  questionType: QuestionTypeSchema,
  difficulty: DifficultySchema,
  question: z.array(ContentBlockSchema).min(1, 'Question must have content'),
  options: z
    .array(MCQOptionSchema)
    .min(2, 'At least 2 options required')
    .max(6, 'Maximum 6 options')
    .refine((opts) => opts.some((o) => o.isCorrect), 'At least one option must be correct'),
  explanation: z.array(ContentBlockSchema).optional(),
  hint: z.array(ContentBlockSchema).optional(),
  tagIds: z.array(z.string()).default([]),
  source: z.string().max(200).optional(),
  isPreviousYear: z.boolean().default(false),
  previousYearExam: z.string().optional(),
  status: MCQStatusSchema.optional(),
  aiMeta: AIGenerationMetaSchema.optional(),
});

export const CreateMCQSchema = MCQBaseSchema.refine(
  (data) => {
    if (data.questionType === 'SINGLE') {
      return data.options.filter((o) => o.isCorrect).length === 1;
    }
    return true;
  },
  { message: 'SINGLE type must have exactly one correct option' }
);

export const UpdateMCQSchema = MCQBaseSchema.partial();

// ─── Tag ──────────────────────────────────────────────────────────────────────

export const CreateTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  color: z.string().min(1, 'Color is required'),
});

export const MergeTagsSchema = z.object({
  sourceTagIds: z.array(z.string()).min(1),
  targetTagId: z.string().min(1),
});

// ─── Mock Session ─────────────────────────────────────────────────────────────

export const MockFiltersSchema = z.object({
  examId: z.string().optional(),
  subjectIds: z.array(z.string()),
  topicIds: z.array(z.string()),
  examSectionIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()),
  difficulty: DifficultyMixedSchema.optional(),
  includeWeightage: z.boolean().default(false),
  includePreviousYear: z.boolean().default(false),
  questionCount: z.number().int().min(10).max(200),
  duration: z.number().int().min(1).optional(),
});

export const GenerateMockSchema = z.object({
  filters: MockFiltersSchema,
});

// ─── Mock Submit ──────────────────────────────────────────────────────────────

export const SubmitResponseSchema = z.object({
  mcqId: z.string().min(1),
  selectedOptionIds: z.array(z.string()),
  timeTakenSeconds: z.number().int().min(0),
});

export const SubmitAttemptSchema = z.object({
  responses: z.array(SubmitResponseSchema),
  timeTakenSeconds: z.number().int().min(0),
});

// ─── Test ─────────────────────────────────────────────────────────────────────

export const CreateTestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  examId: z.string().optional(),
  subjectIds: z.array(z.string()).min(1, 'At least one subject is required'),
  topicIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
  passMark: z.number().int().min(0),
  totalMarks: z.number().int().min(1),
  accessType: TestAccessTypeSchema,
  allowedUserIds: z.array(z.string()).default([]),
  allowedGroupIds: z.array(z.string()).default([]),
  mcqIds: z.array(z.string()).min(1, 'At least one question required'),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showExplanation: ShowExplanationSchema.default('AFTER_SUBMIT'),
  negativeMarking: z.boolean().default(false),
  negativeMarkValue: z.number().min(0).default(0),
  startAt: z.preprocess(
    (val) => (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val) ? val + ':00' : val || undefined),
    z.string().datetime({ local: true }).optional()
  ),
  endAt: z.preprocess(
    (val) => (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val) ? val + ':00' : val || undefined),
    z.string().datetime({ local: true }).optional()
  ),
  status: TestStatusSchema.default('DRAFT'),
});

export const UpdateTestSchema = CreateTestSchema.partial();

// ─── User ─────────────────────────────────────────────────────────────────────

export const UpdateUserRoleSchema = z.object({
  role: UserRoleSchema,
});

export const UpdateUserGroupsSchema = z.object({
  groupIds: z.array(z.string()),
});

// ─── Group ────────────────────────────────────────────────────────────────────

export const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string()).default([]),
});

export const UpdateGroupSchema = CreateGroupSchema.partial();

// ─── PYP ─────────────────────────────────────────────────────────────────────

export const CreatePYPSchema = z.object({
  examId: z.string().min(1, 'Exam is required'),
  title: z.string().min(2, 'Title is required').max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
});

export const UpdatePYPSchema = CreatePYPSchema.partial();

export const AddMCQsToPYPSchema = z.object({
  mcqIds: z.array(z.string().min(1)).min(1),
});

// ─── Query params ─────────────────────────────────────────────────────────────

export const MCQListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  topicAncestorId: z.string().optional(),
  examIds: z.string().optional(),       // comma-separated
  examSectionIds: z.string().optional(), // comma-separated
  tagIds: z.string().optional(),         // comma-separated
  difficulty: DifficultySchema.optional(),
  questionType: QuestionTypeSchema.optional(),
  isPreviousYear: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  status: MCQStatusSchema.optional(),
  search: z.string().optional(),
  pypId: z.string().optional(),
  creatorEmail: z.string().optional(),
});

export const ProgressQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  subjectIds: z.string().optional(), // comma-separated
  type: z.enum(['mocks', 'tests', 'all']).default('all'),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateMCQInput = z.infer<typeof CreateMCQSchema>;
export type UpdateMCQInput = z.infer<typeof UpdateMCQSchema>;
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;
export type CreateTopicInput = z.infer<typeof CreateTopicSchema>;
export type UpdateTopicInput = z.infer<typeof UpdateTopicSchema>;
export type CreateExamInput = z.infer<typeof CreateExamSchema>;
export type UpdateExamInput = z.infer<typeof UpdateExamSchema>;
export type CreateExamSectionInput = z.infer<typeof CreateExamSectionSchema>;
export type UpdateExamSectionInput = z.infer<typeof UpdateExamSectionSchema>;
export type CreateTagInput = z.infer<typeof CreateTagSchema>;
export type MockFiltersInput = z.infer<typeof MockFiltersSchema>;
export type GenerateMockInput = z.infer<typeof GenerateMockSchema>;
export type SubmitAttemptInput = z.infer<typeof SubmitAttemptSchema>;
export type CreateTestInput = z.infer<typeof CreateTestSchema>;
export type UpdateTestInput = z.infer<typeof UpdateTestSchema>;
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type CreatePYPInput = z.infer<typeof CreatePYPSchema>;
export type UpdatePYPInput = z.infer<typeof UpdatePYPSchema>;
export type AddMCQsToPYPInput = z.infer<typeof AddMCQsToPYPSchema>;
export type MCQListQuery = z.infer<typeof MCQListQuerySchema>;
export type ProgressQuery = z.infer<typeof ProgressQuerySchema>;
export type MCQStatus = z.infer<typeof MCQStatusSchema>;
