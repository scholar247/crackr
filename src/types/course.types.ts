/** ISO 8601 date string — all timestamps stored as strings in MongoDB */
type Timestamp = string;

// ─── Enums ────────────────────────────────────────────────────────────────────

export type CourseType = 'LIVE' | 'RECORDED' | 'HYBRID';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'COMING_SOON';
export type LessonType = 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ' | 'ASSIGNMENT';
export type LiveSessionStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// ─── Course ───────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  examId: string;
  type: CourseType;
  level: CourseLevel;
  language: string;
  tags: string[];
  teacherIds: string[];
  primaryTeacherId?: string;
  startDate?: string;
  endDate?: string;
  sessionDays: number[];
  typicalSessionTime?: string;
  maxEnrollments?: number;
  isSubscriptionRequired: boolean;
  status: CourseStatus;
  enrolledCount: number;
  totalLessons: number;
  totalHours: number;
  totalLiveSessions: number;
  publishedAt?: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CourseClient = Omit<Course, 'createdAt' | 'updatedAt' | 'publishedAt'> & {
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

// ─── CourseSubject ────────────────────────────────────────────────────────────

export interface CourseSubject {
  id: string;
  courseId: string;
  title: string;
  iconName?: string;
  color?: string;
  order: number;
  lessonCount: number;
  topicCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CourseSubjectClient = Omit<CourseSubject, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

// ─── CourseTopic ──────────────────────────────────────────────────────────────

export interface CourseTopic {
  id: string;
  courseSubjectId: string;
  courseId: string;
  title: string;
  globalTopicId?: string;
  linkedTestId?: string;
  order: number;
  lessonCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CourseTopicClient = Omit<CourseTopic, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

// ─── CourseLesson ─────────────────────────────────────────────────────────────

export interface CourseLesson {
  id: string;
  courseTopicId: string;
  courseId: string;
  title: string;
  type: LessonType;
  order: number;
  isFree: boolean;
  videoUrl?: string;
  duration?: number;
  textContent?: string;
  pdfUrl?: string;
  pdfDisplayName?: string;
  linkedTestId?: string;
  notesUrl?: string;
  notesName?: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CourseLessonClient = Omit<CourseLesson, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

// ─── LiveSession ──────────────────────────────────────────────────────────────

export interface LiveSession {
  id: string;
  courseId: string;
  title: string;
  teacherId: string;
  scheduledAt: Timestamp;
  duration: number;
  status: LiveSessionStatus;
  joinUrl?: string;
  recordingUrl?: string;
  coversSubjectId?: string;
  coversTopicIds: string[];
  notesUrl?: string;
  notesName?: string;
  joinUrlVisibleMinutesBefore: number;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  attendanceCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type LiveSessionClient = Omit<LiveSession, 'createdAt' | 'updatedAt' | 'scheduledAt' | 'startedAt' | 'endedAt'> & {
  createdAt: string;
  updatedAt: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
};

// ─── Enrollment ───────────────────────────────────────────────────────────────

export interface Enrollment {
  id: string;       // userId is the doc ID in courses/{courseId}/enrollments subcollection
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  progress: number; // 0-100
  completedLessonIds: string[];
  lastLessonId?: string;
  lastAccessedAt?: Timestamp;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
}

export type EnrollmentClient = Omit<Enrollment, 'enrolledAt' | 'completedAt' | 'lastAccessedAt'> & {
  enrolledAt: string;
  completedAt?: string;
  lastAccessedAt?: string;
};

// ─── Enriched types (with joined data) ───────────────────────────────────────

export interface CourseWithEnrollment extends CourseClient {
  enrollment?: EnrollmentClient;
  isLive?: boolean;
}

export interface CourseLessonWithAccess extends CourseLessonClient {
  isLocked: boolean;
  completionStatus: 'completed' | 'current' | 'locked' | 'available';
}

export interface CourseTopicWithLessons extends CourseTopicClient {
  lessons: CourseLessonWithAccess[];
}

export interface CourseSubjectWithTopics extends CourseSubjectClient {
  topics: CourseTopicWithLessons[];
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface CourseAnalytics {
  totalEnrolled: number;
  activeStudents: number;
  avgProgress: number;
  completionRate: number;
  liveAttendanceRate: number;
  enrollmentTrend: { date: string; count: number }[];
  progressDistribution: { bucket: string; count: number }[];
  subjectCompletion: { subjectTitle: string; completionRate: number }[];
  sessionAttendance: { title: string; date: string; attended: number; percentOfEnrolled: number }[];
  lessonEngagement: { title: string; type: LessonType; views: number; avgCompletionPct: number }[];
}

// ─── Announcement ─────────────────────────────────────────────────────────────

export interface CourseAnnouncement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdBy: string;
  createdAt: Timestamp;
}

export type CourseAnnouncementClient = Omit<CourseAnnouncement, 'createdAt'> & {
  createdAt: string;
};
