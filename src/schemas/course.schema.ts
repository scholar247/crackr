import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const CourseTypeSchema = z.enum(['LIVE', 'RECORDED', 'HYBRID']);
export const CourseLevelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
export const CourseStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'COMING_SOON']);
export const LessonTypeSchema = z.enum(['VIDEO', 'TEXT', 'PDF', 'QUIZ', 'ASSIGNMENT']);
export const LiveSessionStatusSchema = z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']);
export const EnrollmentStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']);

// ─── Course ───────────────────────────────────────────────────────────────────

export const CreateCourseSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  shortDescription: z.string().max(160).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  examId: z.string().min(1, 'Exam is required'),
  type: CourseTypeSchema,
  level: CourseLevelSchema.default('BEGINNER'),
  language: z.string().default('English'),
  tags: z.array(z.string()).default([]),
  teacherIds: z.array(z.string()).default([]),
  primaryTeacherId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sessionDays: z.array(z.number().int().min(0).max(6)).default([]),
  typicalSessionTime: z.string().optional(),
  maxEnrollments: z.number().int().min(1).optional(),
  isSubscriptionRequired: z.boolean().default(false),
  status: CourseStatusSchema.default('DRAFT'),
});

export const UpdateCourseSchema = CreateCourseSchema.partial();

// ─── CourseSubject ────────────────────────────────────────────────────────────

export const CreateCourseSubjectSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(200),
  iconName: z.string().optional(),
  color: z.string().optional(),
  order: z.number().int().min(0).default(0),
});

export const UpdateCourseSubjectSchema = CreateCourseSubjectSchema.partial().omit({ courseId: true });

export const ReorderCourseSubjectsSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

// ─── CourseTopic ──────────────────────────────────────────────────────────────

export const CreateCourseTopicSchema = z.object({
  courseSubjectId: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(200),
  globalTopicId: z.string().optional(),
  linkedTestId: z.string().optional(),
  order: z.number().int().min(0).default(0),
});

export const UpdateCourseTopicSchema = CreateCourseTopicSchema.partial().omit({ courseSubjectId: true, courseId: true });

export const ReorderCourseTopicsSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

// ─── CourseLesson ─────────────────────────────────────────────────────────────

export const CreateCourseLessonSchema = z.object({
  courseTopicId: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(200),
  type: LessonTypeSchema,
  order: z.number().int().min(0).default(0),
  isFree: z.boolean().default(false),

  // VIDEO
  videoUrl: z.string().url().optional().or(z.literal('')),
  duration: z.number().int().min(0).optional(),

  // TEXT
  textContent: z.string().optional(),

  // PDF
  pdfUrl: z.string().url().optional().or(z.literal('')),
  pdfDisplayName: z.string().optional(),

  // QUIZ
  linkedTestId: z.string().optional(),

  // Common
  notesUrl: z.string().url().optional().or(z.literal('')),
  notesName: z.string().optional(),
  description: z.string().optional(),
});

export const UpdateCourseLessonSchema = CreateCourseLessonSchema.partial().omit({ courseTopicId: true, courseId: true });

export const ReorderCourseLessonsSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

export const MarkLessonCompleteSchema = z.object({
  lessonId: z.string().min(1),
  courseId: z.string().min(1),
});

// ─── LiveSession ──────────────────────────────────────────────────────────────

export const CreateLiveSessionSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(200),
  teacherId: z.string().min(1),
  scheduledAt: z.string().datetime({ local: true }),
  duration: z.number().int().min(1, 'Duration is required'),
  coversSubjectId: z.string().optional(),
  coversTopicIds: z.array(z.string()).default([]),
  notesUrl: z.string().url().optional().or(z.literal('')),
  notesName: z.string().optional(),
  joinUrlVisibleMinutesBefore: z.number().int().min(0).default(15),
});

export const UpdateLiveSessionSchema = CreateLiveSessionSchema.partial().omit({ courseId: true });

export const GoLiveSchema = z.object({
  joinUrl: z.string().url('Must be a valid URL'),
});

// ─── Enrollment ───────────────────────────────────────────────────────────────

export const EnrollSchema = z.object({
  courseId: z.string().min(1),
});

export const AdminEnrollStudentSchema = z.object({
  userId: z.string().min(1),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type CreateCourseSubjectInput = z.infer<typeof CreateCourseSubjectSchema>;
export type UpdateCourseSubjectInput = z.infer<typeof UpdateCourseSubjectSchema>;
export type CreateCourseTopicInput = z.infer<typeof CreateCourseTopicSchema>;
export type UpdateCourseTopicInput = z.infer<typeof UpdateCourseTopicSchema>;
export type CreateCourseLessonInput = z.infer<typeof CreateCourseLessonSchema>;
export type UpdateCourseLessonInput = z.infer<typeof UpdateCourseLessonSchema>;
export type CreateLiveSessionInput = z.infer<typeof CreateLiveSessionSchema>;
export type UpdateLiveSessionInput = z.infer<typeof UpdateLiveSessionSchema>;
export type GoLiveInput = z.infer<typeof GoLiveSchema>;
