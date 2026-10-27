import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';
import { examSpotlightRepository } from '@/server/repositories/exam-spotlight.repository';
import { articleRepository } from '@/server/repositories/article.repository';
import { assessmentRepository, type ProgressGroup } from '@/server/repositories/assessment.repository';
import { questionRepository } from '@/server/repositories/question.repository';
import { blogsPath } from '@/server/services/blog-browse';
import { SYLLABUS, type SyllabusSubject, type SyllabusUnit } from '@/content/exams/nimcet/syllabus';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import type { LandingExam } from './cbse-class-10';

// Joins the official NIMCET syllabus (content/exams/nimcet) to what SyllabuzAI actually has
// for it — published questions, notes, mocks and the viewer's own progress — through the
// existing repositories. Every count on the NIMCET pages comes from here; a unit without a
// matching curriculum node gets zero counts and no practice link, never a made-up number.

export interface NimcetUnit extends SyllabusUnit {
  href: string;
  questionCount: number;
  articleCount: number;
  /** Practice browser deep link; null when no questions are tagged to this unit yet. */
  practiceHref: string | null;
  notesHref: string | null;
}

export interface NimcetSubject extends Omit<SyllabusSubject, 'units'> {
  href: string;
  nodeId: string | null;
  questionCount: number;
  articleCount: number;
  practiceHref: string | null;
  notesHref: string | null;
  units: NimcetUnit[];
  /** Mock-score progress for this subject; only for a signed-in viewer with attempts. */
  progress: ProgressGroup | null;
}

export interface NimcetMock {
  id: string;
  title: string;
  durationSeconds: number | null;
  /** 'open' = published by SyllabuzAI for everyone; 'practice' = other public tests. Neither is an official NIMCET paper. */
  kind: 'open' | 'practice';
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

function sumOver(ids: string[], counts: Map<string, number>) {
  return ids.reduce((n, id) => n + (counts.get(id) ?? 0), 0);
}

export async function getNimcetData(exam: LandingExam, userId: string | null) {
  const [tree, spotlight, articleCounts, publicMocks, openMocks, examProgress, subjectProgress] = await Promise.all([
    taxonomyRepository.getSyllabusTree(exam.id),
    examSpotlightRepository.getSpotlight(exam.id),
    articleRepository.countPublishedByNode(),
    assessmentRepository.findPublicByExam(exam.id, 6),
    assessmentRepository.findOpenMocksForExams([exam.id], 6),
    userId ? assessmentRepository.getUserProgress(userId, 'exam') : Promise.resolve(null),
    userId ? assessmentRepository.getUserProgress(userId, 'subject') : Promise.resolve(null),
  ]);
  const questionCounts = await questionRepository.countPublishedByNodes([...collectIds(tree)], exam.id);

  const subjects: NimcetSubject[] = SYLLABUS.map((official) => {
    // The practice browser only understands subject → chapter, so units resolve against the
    // matched subject node's direct children.
    const node = tree.find((n) => official.nodeSlugs.includes(n.slug)) ?? null;
    const questionCount = node ? (questionCounts.get(node.id) ?? 0) : 0;
    const articleCount = node ? (articleCounts.get(node.id) ?? 0) : 0;
    const subjectHref = `${NIMCET_PATH}/${official.slug}`;

    const units: NimcetUnit[] = official.units.map((u) => {
      const chapters = node ? node.children.filter((c) => u.nodeSlugs.includes(c.slug)) : [];
      const ids = chapters.map((c) => c.id);
      const unitQuestions = sumOver(ids, questionCounts);
      const unitArticles = sumOver(ids, articleCounts);
      // With one matching chapter the link opens exactly that chapter; with several, the subject.
      const target = chapters.length === 1 ? chapters[0] : null;
      return {
        ...u,
        href: `${subjectHref}/${u.slug}`,
        questionCount: unitQuestions,
        articleCount: unitArticles,
        practiceHref: node && unitQuestions > 0 ? practiceHref(exam.slug, node.id, target?.id) : null,
        notesHref: node && target && unitArticles > 0 ? blogsPath(exam.slug, [node, target]) : null,
      };
    });

    return {
      ...official,
      href: subjectHref,
      nodeId: node?.id ?? null,
      questionCount,
      articleCount,
      practiceHref: node && questionCount > 0 ? practiceHref(exam.slug, node.id) : null,
      notesHref: node && articleCount > 0 ? blogsPath(exam.slug, [node]) : null,
      units,
      progress: (node && subjectProgress?.find((g) => g.id === node.id)) || null,
    };
  });

  const mocks: NimcetMock[] = [
    ...openMocks.map((m) => ({ id: m.id, title: m.title, durationSeconds: m.durationSeconds, kind: 'open' as const })),
    ...publicMocks.map((m) => ({ id: m.id, title: m.title, durationSeconds: m.durationSeconds, kind: 'practice' as const })),
  ];

  return {
    exam,
    subjects,
    stats: spotlight.stats,
    dailyProblem: spotlight.dailyProblem,
    mocks,
    progress: examProgress?.find((g) => g.meta === exam.slug) ?? null,
    signedIn: !!userId,
    links: {
      practice: practiceHref(exam.slug),
      practiceHub: `/practice/exams/${exam.slug}`,
      notes: blogsPath(exam.slug),
      buildMock: `/mocks/new/self?exam=${exam.id}`,
    },
  };
}

export type NimcetData = Awaited<ReturnType<typeof getNimcetData>>;
