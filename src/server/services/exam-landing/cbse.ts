import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';
import { examSpotlightRepository } from '@/server/repositories/exam-spotlight.repository';
import { articleRepository } from '@/server/repositories/article.repository';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { questionRepository } from '@/server/repositories/question.repository';
import { notificationRepository } from '@/server/repositories/notification.repository';
import { samplePaperRepository } from '@/server/repositories/sample-paper.repository';
import { mindMapRepository } from '@/server/repositories/mind-map.repository';
import { mindMapsPath } from '@/lib/mind-maps';
import { blogsPath } from '@/server/services/blog-browse';
import { samplePapersPath } from '@/lib/sample-papers';
import { BOARD_NOTIFICATION_LIMIT, NEW_NOTICE_DAYS, noticeHref } from '@/lib/notifications';
import type { CbseBoard, CbseSubjectKey } from '@/content/exams/cbse/types';

export interface LandingExam {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface LandingTopic {
  id: string;
  slug: string;
  name: string;
  questionCount: number;
  practiceHref: string;
}

export interface LandingChapter {
  id: string;
  slug: string;
  name: string;
  questionCount: number;
  articleCount: number;
  topicNames: string[];
  /** Direct children (topics), for topic-level practice. */
  topics: LandingTopic[];
  practiceHref: string;
  notesHref: string;
  /** Published mind map for this chapter, if any. */
  mindMapHref: string | null;
}

export interface LandingSubject {
  id: string;
  slug: string;
  name: string;
  key: CbseSubjectKey | null;
  questionCount: number;
  articleCount: number;
  chapters: LandingChapter[];
  practiceHref: string;
  notesHref: string;
  /** Published mind maps in this subject (0 → no link). */
  mindMapCount: number;
  mindMapsHref: string;
}

export interface LandingMock {
  id: string;
  title: string;
  durationSeconds: number | null;
  kind: 'official' | 'practice';
}

function practiceHref(examSlug: string, subjectId?: string, chapterId?: string, topicId?: string) {
  const params = new URLSearchParams();
  if (subjectId) params.set('subject', subjectId);
  if (chapterId) params.set('chapter', chapterId);
  if (topicId) params.set('topic', topicId);
  const qs = params.toString();
  return `/practice/exams/${examSlug}/questions${qs ? `?${qs}` : ''}`;
}

function collectIds(nodes: SyllabusNode[], out: Set<string> = new Set()) {
  for (const n of nodes) {
    out.add(n.id);
    collectIds(n.children, out);
  }
  return out;
}

function leafNames(node: SyllabusNode): string[] {
  return node.children.flatMap((c) => [c.name, ...leafNames(c)]);
}

// Everything a CBSE board landing (home or inner page) shows, read through the existing
// repositories in one parallel batch. The progress lookup only runs for a signed-in viewer.
export async function getCbseLandingData(exam: LandingExam, userId: string | null, board: CbseBoard) {
  const [syllabus, spotlight, articleCounts, articles, practiceMocks, officialMocks, progressGroups, notifications, samplePapers, mindMaps] = await Promise.all([
    taxonomyRepository.getSyllabusTree(exam.id),
    examSpotlightRepository.getSpotlight(exam.id),
    articleRepository.countPublishedByNode(),
    articleRepository.findPublishedByExam(exam.id, 12),
    assessmentRepository.findPublicByExam(exam.id, 4),
    assessmentRepository.findOpenMocksForExams([exam.id], 4),
    userId ? assessmentRepository.getUserProgress(userId, 'exam') : Promise.resolve(null),
    notificationRepository.listBoardByExam(exam.id, BOARD_NOTIFICATION_LIMIT),
    samplePaperRepository.listPublishedByExam(exam.id),
    mindMapRepository.listPublishedByExam(exam.id),
  ]);
  const publishedMindMaps = new Set(mindMaps.map((m) => m.chapterNodeId));

  const questionCounts = await questionRepository.countPublishedByNodes([...collectIds(syllabus)], exam.id);

  const subjects: LandingSubject[] = syllabus.map((subject) => ({
    id: subject.id,
    slug: subject.slug,
    name: board.shortSubjectName(subject.name),
    key: board.subjectKeyFor(subject.slug),
    questionCount: questionCounts.get(subject.id) ?? 0,
    articleCount: articleCounts.get(subject.id) ?? 0,
    practiceHref: practiceHref(exam.slug, subject.id),
    notesHref: blogsPath(exam.slug, [subject]),
    mindMapCount: subject.children.filter((c) => publishedMindMaps.has(c.id)).length,
    mindMapsHref: mindMapsPath(exam.slug, subject.slug),
    chapters: subject.children
      .filter((c) => c.nodeType === 'CHAPTER')
      .map((chapter) => ({
        id: chapter.id,
        slug: chapter.slug,
        name: chapter.name,
        questionCount: questionCounts.get(chapter.id) ?? 0,
        articleCount: articleCounts.get(chapter.id) ?? 0,
        topicNames: leafNames(chapter),
        // Tags include every ancestor, so a topic's count is everything at or below it — the
        // same set the practice browser shows when filtered to that topic.
        topics: chapter.children.map((topic) => ({
          id: topic.id,
          slug: topic.slug,
          name: topic.name,
          questionCount: questionCounts.get(topic.id) ?? 0,
          practiceHref: practiceHref(exam.slug, subject.id, chapter.id, topic.id),
        })),
        practiceHref: practiceHref(exam.slug, subject.id, chapter.id),
        notesHref: blogsPath(exam.slug, [subject, chapter]),
        mindMapHref: publishedMindMaps.has(chapter.id) ? mindMapsPath(exam.slug, subject.slug, chapter.slug) : null,
      })),
  }));

  const mocks: LandingMock[] = [
    ...officialMocks.map((m) => ({ id: m.id, title: m.title, durationSeconds: m.durationSeconds, kind: 'official' as const })),
    ...practiceMocks.map((m) => ({ id: m.id, title: m.title, durationSeconds: m.durationSeconds, kind: 'practice' as const })),
  ];

  return {
    exam,
    board,
    subjects,
    stats: spotlight.stats,
    dailyProblem: spotlight.dailyProblem,
    articles,
    mocks,
    progress: progressGroups?.find((g) => g.meta === exam.slug) ?? null,
    signedIn: !!userId,
    // `isNew` is decided here (request time) rather than in a component, so render stays pure.
    notifications: notifications.map((n) => ({ ...n, isNew: Date.now() - n.publishedAt.getTime() < NEW_NOTICE_DAYS * 86_400_000 })),
    samplePaperCount: samplePapers.length,
    links: {
      practice: practiceHref(exam.slug),
      practiceHub: `/practice/exams/${exam.slug}`,
      /** Every published note for the exam on the blog (the landing's notes page links here for the full list). */
      notes: blogsPath(exam.slug),
      samplePapers: samplePapersPath(exam.slug),
      notifications: noticeHref(exam.slug),
    },
  };
}

export type CbseLandingData = Awaited<ReturnType<typeof getCbseLandingData>>;
