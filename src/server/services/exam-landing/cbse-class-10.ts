import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';
import { examSpotlightRepository } from '@/server/repositories/exam-spotlight.repository';
import { articleRepository } from '@/server/repositories/article.repository';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { questionRepository } from '@/server/repositories/question.repository';
import { blogsPath } from '@/server/services/blog-browse';
import { shortSubjectName, subjectKeyFor, type SubjectKey } from '@/components/exam-landing/cbse-class-10/content';

export interface LandingExam {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface LandingChapter {
  id: string;
  name: string;
  questionCount: number;
  articleCount: number;
  topicNames: string[];
  practiceHref: string;
  notesHref: string;
}

export interface LandingSubject {
  id: string;
  name: string;
  key: SubjectKey | null;
  questionCount: number;
  articleCount: number;
  chapters: LandingChapter[];
  practiceHref: string;
  notesHref: string;
}

export interface LandingMock {
  id: string;
  title: string;
  durationSeconds: number | null;
  kind: 'official' | 'practice';
}

function practiceHref(examSlug: string, subjectId?: string, chapterId?: string) {
  const params = new URLSearchParams();
  if (subjectId) params.set('subject', subjectId);
  if (chapterId) params.set('chapter', chapterId);
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

// Everything the CBSE Class 10 landing page shows, read through the existing repositories
// in one parallel batch. The progress lookup only runs for a signed-in viewer.
export async function getCbseClass10LandingData(exam: LandingExam, userId: string | null) {
  const [syllabus, spotlight, articleCounts, articles, practiceMocks, officialMocks, progressGroups] = await Promise.all([
    taxonomyRepository.getSyllabusTree(exam.id),
    examSpotlightRepository.getSpotlight(exam.id),
    articleRepository.countPublishedByNode(),
    articleRepository.findPublishedByExam(exam.id, 6),
    assessmentRepository.findPublicByExam(exam.id, 4),
    assessmentRepository.findOpenMocksForExams([exam.id], 4),
    userId ? assessmentRepository.getUserProgress(userId, 'exam') : Promise.resolve(null),
  ]);

  const questionCounts = await questionRepository.countPublishedByNodes([...collectIds(syllabus)], exam.id);

  const subjects: LandingSubject[] = syllabus.map((subject) => ({
    id: subject.id,
    name: shortSubjectName(subject.name),
    key: subjectKeyFor(subject.slug),
    questionCount: questionCounts.get(subject.id) ?? 0,
    articleCount: articleCounts.get(subject.id) ?? 0,
    practiceHref: practiceHref(exam.slug, subject.id),
    notesHref: blogsPath(exam.slug, [subject]),
    chapters: subject.children
      .filter((c) => c.nodeType === 'CHAPTER')
      .map((chapter) => ({
        id: chapter.id,
        name: chapter.name,
        questionCount: questionCounts.get(chapter.id) ?? 0,
        articleCount: articleCounts.get(chapter.id) ?? 0,
        topicNames: leafNames(chapter),
        practiceHref: practiceHref(exam.slug, subject.id, chapter.id),
        notesHref: blogsPath(exam.slug, [subject, chapter]),
      })),
  }));

  const mocks: LandingMock[] = [
    ...officialMocks.map((m) => ({ id: m.id, title: m.title, durationSeconds: m.durationSeconds, kind: 'official' as const })),
    ...practiceMocks.map((m) => ({ id: m.id, title: m.title, durationSeconds: m.durationSeconds, kind: 'practice' as const })),
  ];

  return {
    exam,
    subjects,
    stats: spotlight.stats,
    dailyProblem: spotlight.dailyProblem,
    articles,
    mocks,
    progress: progressGroups?.find((g) => g.meta === exam.slug) ?? null,
    signedIn: !!userId,
    links: {
      practice: practiceHref(exam.slug),
      practiceHub: `/practice/exams/${exam.slug}`,
      notes: blogsPath(exam.slug),
    },
  };
}

export type CbseClass10LandingData = Awaited<ReturnType<typeof getCbseClass10LandingData>>;
