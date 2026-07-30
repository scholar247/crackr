/** ISO 8601 date string — all timestamps stored as strings in MongoDB */
type Timestamp = string;

// ─── Roles ───────────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'EDITOR' | 'REVIEWER' | 'STUDENT';

// ─── User Profile ─────────────────────────────────────────────────────────────

export type PreparationLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type PreferredDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';

export interface UserProfile {
  targetExamIds: string[];
  primaryExamId: string;
  preparationLevel: PreparationLevel;
  targetYear?: number;
  weakTopicIds: string[];
  strongTopicIds: string[];
  weakSubjectIds: string[];
  preferredDifficulty: PreferredDifficulty;
  dailyGoalQuestions: number;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: Timestamp;
  onboardingStep: number;
}

export const DEFAULT_PROFILE: Omit<UserProfile, 'onboardingCompletedAt'> = {
  targetExamIds: [],
  primaryExamId: '',
  preparationLevel: 'BEGINNER',
  weakTopicIds: [],
  strongTopicIds: [],
  weakSubjectIds: [],
  preferredDifficulty: 'MIXED',
  dailyGoalQuestions: 20,
  onboardingCompleted: false,
  onboardingStep: 0,
};

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role: UserRole;
  groupIds: string[];
  profile: UserProfile;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Subject ─────────────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  description?: string;
  iconName: string;
  color: string;
  isActive: boolean;
  topicCount: number;
  mcqCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Topic (replaces Category — self-referencing tree) ───────────────────────

export interface Topic {
  id: string;
  name: string;
  slug: string;
  subjectId: string;
  parentId: string | null;
  depth: number;           // 0=chapter, 1=section, 2=subtopic
  path: string[];          // ordered ancestor ids
  pathNames: string[];     // human-readable ancestor names
  order: number;
  description?: string;
  isActive: boolean;
  mcqCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TopicTreeNode extends TopicClient {
  children: TopicTreeNode[];
  inSyllabus?: boolean; // true = directly in exam syllabus; false = structural ancestor only
}

// ─── Exam ────────────────────────────────────────────────────────────────────

export type ExamCategory =
  | 'ENGINEERING'
  | 'MEDICAL'
  | 'MANAGEMENT'
  | 'BANKING'
  | 'GOVERNMENT'
  | 'SCHOOL'
  | 'OTHER';

export interface Exam {
  id: string;
  name: string;
  fullName: string;
  slug: string;
  category: ExamCategory;
  conductedBy: string;
  description?: string;
  logoUrl?: string;
  officialWebsite?: string;
  isActive: boolean;
  isFeatured: boolean;
  subjectIds: string[];
  mcqCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── ExamSection (syllabus mapping) ──────────────────────────────────────────

export interface ExamSection {
  id: string;
  examId: string;
  subjectId: string;
  topicId: string;
  displayName?: string;
  weightage?: number;
  difficultyProfile: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  syllabusNotes?: string;
  isActive: boolean;
  order: number;
}

// ─── PYP (Previous Year Paper) ───────────────────────────────────────────────

export interface PYPMeta {
  pypId: string;
  pypTitle: string;
}

export interface PYP {
  id: string;
  examId: string;
  examName: string;
  examSlug: string;
  title: string;
  slug: string;
  year: number;
  month: number; // 1–12
  description?: string;
  mcqIds: string[];
  mcqCount: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  usageCount: number;
  createdAt: Timestamp;
}

// ─── Content blocks ──────────────────────────────────────────────────────────

export type ContentBlockType = 'TEXT' | 'MATH' | 'CHEMISTRY' | 'IMAGE' | 'AUDIO' | 'VIDEO';

export interface ContentBlock {
  type: ContentBlockType;
  content: string;
  altText?: string;
}

// ─── MCQ ─────────────────────────────────────────────────────────────────────

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type QuestionType = 'SINGLE' | 'MULTIPLE';
export type MCQStatus = 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface MCQOption {
  id: string;
  content: ContentBlock[];
  isCorrect: boolean;
}

export interface MCQ {
  id: string;

  // Taxonomy
  subjectId: string;
  topicId: string;
  topicPath: string[];
  topicPathNames: string[];

  // Exam mapping
  examIds: string[];
  examSectionIds: string[];

  // Content
  questionType: QuestionType;
  difficulty: Difficulty;
  question: ContentBlock[];
  options: MCQOption[];
  explanation?: ContentBlock[];
  hint?: ContentBlock[];

  // Metadata
  tagIds: string[];
  source?: string;
  isPreviousYear: boolean;
  previousYearExam?: string;
  pyps: PYPMeta[];

  // Status
  isActive: boolean;
  isVerified: boolean;
  status: MCQStatus;
  creatorEmail: string;
  createdBy: string;
  verifiedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Analytics
  usageCount: number;
  attemptCount: number;
  correctCount: number;
  accuracyRate: number;
  avgTimeTakenSeconds: number;
}

// ─── Group ───────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  createdBy: string;
  createdAt: Timestamp;
}

// ─── Test ────────────────────────────────────────────────────────────────────

export type TestAccessType = 'ALL' | 'USERS' | 'GROUPS';
export type ShowExplanation = 'NEVER' | 'AFTER_SUBMIT' | 'AFTER_DEADLINE';
export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Test {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  accessType: TestAccessType;
  allowedUserIds: string[];
  allowedGroupIds: string[];
  mcqIds: string[];
  totalMarks: number;
  duration: number;
  passMark: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanation: ShowExplanation;
  negativeMarking: boolean;
  negativeMarkValue: number;
  startAt?: Timestamp;
  endAt?: Timestamp;
  status: TestStatus;
  examId?: string;
  subjectIds: string[];
  topicIds: string[];
  tagIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Test Attempt ─────────────────────────────────────────────────────────────

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED';

export interface AttemptResponse {
  mcqId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  marksAwarded: number;
  timeTakenSeconds: number;
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  responses: AttemptResponse[];
  totalMarks: number;
  marksObtained: number;
  percentile?: number;
  rank?: number;
  timeTakenSeconds: number;
  status: AttemptStatus;
  startedAt: Timestamp;
  submittedAt?: Timestamp;
  shuffledMcqIds?: string[];
}

// ─── Mock Session ─────────────────────────────────────────────────────────────

export interface MockFilters {
  examId?: string;
  subjectIds: string[];
  topicIds: string[];
  examSectionIds?: string[];
  tagIds: string[];
  difficulty?: Difficulty | 'MIXED';
  includeWeightage?: boolean;
  includePreviousYear?: boolean;
  questionCount: number;
  duration?: number;
}

export interface MockSession {
  id: string;
  userId: string;
  filters: MockFilters;
  mcqIds: string[];
  attempt?: TestAttempt;
  createdAt: Timestamp;
}

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  meta?: ApiMeta;
}

// ─── Client-safe types (Timestamps serialized to strings) ────────────────────

export type SerializedTimestamp = { seconds: number; nanoseconds: number } | string;

export type Serialized<T> = {
  [K in keyof T]: T[K] extends Timestamp
    ? string
    : T[K] extends Timestamp | undefined
    ? string | undefined
    : T[K] extends object
    ? Serialized<T[K]>
    : T[K];
};

export type UserClient = Omit<User, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type SubjectClient = Omit<Subject, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type TopicClient = Omit<Topic, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type ExamClient = Omit<Exam, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type ExamSectionClient = ExamSection; // no timestamps

export type MCQClient = Omit<MCQ, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type TestClient = Omit<Test, 'createdAt' | 'updatedAt' | 'startAt' | 'endAt'> & {
  createdAt: string;
  updatedAt: string;
  startAt?: string;
  endAt?: string;
};

export type TestAttemptClient = Omit<TestAttempt, 'startedAt' | 'submittedAt'> & {
  startedAt: string;
  submittedAt?: string;
};

export type PYPClient = Omit<PYP, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type MockSessionClient = Omit<MockSession, 'createdAt'> & {
  createdAt: string;
  attempt?: TestAttemptClient;
};

// ─── Blog ─────────────────────────────────────────────────────────────────────

export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type BlogType = 'THEORY' | 'QUICK_LEARN';

export interface BlogSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robots?: string;        // e.g. "index,follow"
  schemaType?: string;    // e.g. "Article", "HowTo"
}

export interface BlogSlugHistoryEntry {
  slug: string;
  replacedAt: Timestamp;
}

export interface Blog {
  id: string;
  type: BlogType;
  title: string;
  slug: string;
  slugHistory: BlogSlugHistoryEntry[];

  // Taxonomy (many-to-many)
  examIds: string[];
  subjectIds: string[];
  topicIds: string[];

  // Content (Markdown string from the Tiptap editor, incl. GFM tables and ::: callout blocks)
  summary: string;         // plain-text excerpt for cards/SEO fallback
  content: string;

  // Media
  featuredImage?: string;
  thumbnail?: string;

  // Related
  relatedBlogIds: string[];

  // Tags
  tagIds: string[];

  // SEO
  seo: BlogSEO;

  // Analytics (computed / cached)
  readingTimeMinutes: number;
  viewCount: number;

  // Status
  status: BlogStatus;
  isActive: boolean;       // true when PUBLISHED
  publishedAt?: Timestamp;
  archivedAt?: Timestamp;

  // Auth
  createdBy: string;
  creatorEmail: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BlogClient = Omit<Blog, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface ProgressSummary {
  totalAttempts: number;
  avgScore: number;
  bestStreak: number;
  improvementTrend: 'up' | 'down' | 'stable';
}

export interface ScoreTrendPoint {
  date: string;
  score: number;
  type: 'mock' | 'test';
  label: string;
}

export interface SubjectProficiency {
  subjectId: string;
  subjectName: string;
  proficiency: number;
}

export interface DifficultyBreakdown {
  subjectName: string;
  EASY: number;
  MEDIUM: number;
  HARD: number;
  EXPERT: number;
}

export interface TopicStats {
  topicId: string;
  topicName: string;
  subjectName: string;
  accuracy: number;
  attempted: number;
  avgTimeSeconds: number;
}

export interface WeakArea {
  topicId: string;
  topicName: string;
  subjectName: string;
  tagId?: string;
  tagName?: string;
  accuracy: number;
  attempted: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'mock' | 'test';
  title: string;
  score: number;
  totalMarks: number;
  completedAt: string;
}

export interface ProgressData {
  summary: ProgressSummary;
  scoreTrend: ScoreTrendPoint[];
  subjectProficiency: SubjectProficiency[];
  difficultyBreakdown: DifficultyBreakdown[];
  topicStats: TopicStats[];
  weakAreas: WeakArea[];
  recentActivity: ActivityFeedItem[];
}

// ─── Syllabus coverage ───────────────────────────────────────────────────────

export interface SyllabusCoverageItem {
  topicId: string;
  topicName: string;
  topicPath: string[];
  topicPathNames: string[];
  attempted: boolean;
  accuracy: number;
  attempts: number;
}

// ─── NextAuth session extension ───────────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: UserRole;
    };
  }
  interface User {
    role?: UserRole;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
