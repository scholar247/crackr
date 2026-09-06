import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { userRepository } from '@/server/repositories/user.repository';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { articleRepository } from '@/server/repositories/article.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { EXAM_STATS, DEFAULT_EXAM_STATS, computeExamInitials } from '@/lib/exam-stats';
import type { ExamCardData } from '@/lib/exam-stats';
import { PRIMARY_EXAM_SLUGS, FEATURED_ANONYMOUS_EXAM_SLUG } from '@/lib/primary-exams';
import { Hero } from '@/components/marketing/home/hero';
import { FeatureStrip } from '@/components/marketing/home/feature-strip';
import { ExploreExams } from '@/components/marketing/home/explore-exams';
import { MasterConcepts } from '@/components/marketing/home/master-concepts';
import { PracticeShowcase } from '@/components/marketing/home/practice-showcase';
import { FrameworkSteps } from '@/components/marketing/home/framework-steps';
import { Team } from '@/components/marketing/home/team';
import { CtaBand } from '@/components/marketing/home/cta-band';
import { IncompleteProfileBanner } from '@/components/marketing/home/incomplete-profile-banner';
import { LoggedInHero } from '@/components/marketing/home/logged-in-hero';
import { ContinueMockCard } from '@/components/marketing/home/continue-mock-card';
import { HotTopics } from '@/components/marketing/home/hot-topics';
import { PracticeShortcuts } from '@/components/marketing/home/practice-shortcuts';
import { MockPromptCard } from '@/components/marketing/home/mock-prompt-card';
import { OpenMocksPanel, type OpenMockEntry } from '@/components/marketing/home/open-mocks-panel';
import { CoursesComingSoonCard } from '@/components/marketing/home/courses-coming-soon-card';

export const metadata: Metadata = {
  title: 'NIMCET, GATE, CUET & CBSE Prep',
  description:
    'Prep for NIMCET, GATE-CSE, CUET-UG and CBSE boards with structured theory, PYQs, MCQ practice and mock tests — built by engineers who took these exams themselves.',
};

export const dynamic = 'force-dynamic';

async function getFeaturedExams(limit = 5): Promise<ExamCardData[]> {
  const examRows = await taxonomyRepository.listPublicExams();

  // Same "richest seeded syllabus wins" ranking used on /exams, so the exam
  // featured here matches the one featured there rather than picking arbitrarily.
  const subjectCounts = await Promise.all(
    examRows.map(async ({ exam }) => [exam.id, (await taxonomyRepository.getSyllabusTree(exam.id)).length] as const)
  );
  const subjectCountByExamId = new Map(subjectCounts);

  // The homepage deliberately leads with a curated set instead of leaving the featured
  // lineup entirely to incidental syllabus richness. FEATURED_ANONYMOUS_EXAM_SLUG (the
  // anonymous/incomplete-profile "hot exam" pitch) always wins the top slot; the rest of
  // PRIMARY_EXAM_SLUGS keeps its order; remaining slots fall back to richest-syllabus-first.
  const rankedSlugs = [FEATURED_ANONYMOUS_EXAM_SLUG, ...PRIMARY_EXAM_SLUGS.filter((slug) => slug !== FEATURED_ANONYMOUS_EXAM_SLUG)];
  const primaryIndex = new Map<string, number>(rankedSlugs.map((slug, i) => [slug, i]));
  const ranked = [...examRows].sort((a, b) => {
    const aPrimary = primaryIndex.get(a.exam.slug);
    const bPrimary = primaryIndex.get(b.exam.slug);
    if (aPrimary !== undefined || bPrimary !== undefined) {
      if (aPrimary === undefined) return 1;
      if (bPrimary === undefined) return -1;
      return aPrimary - bPrimary;
    }
    return (
      (subjectCountByExamId.get(b.exam.id) ?? 0) - (subjectCountByExamId.get(a.exam.id) ?? 0) ||
      a.exam.name.localeCompare(b.exam.name)
    );
  });

  const taken = new Set<string>();
  return ranked.slice(0, limit).map(({ exam }) => ({
    id: exam.id,
    slug: exam.slug,
    name: exam.name,
    description: exam.description,
    initials: computeExamInitials(exam.name, taken),
    stats: EXAM_STATS[exam.slug] ?? DEFAULT_EXAM_STATS,
  }));
}

// Anonymous homepage — also the fallback for a logged-in user whose session no longer
// resolves to a real account (deleted/disabled mid-session), so this page never crashes
// on a stale session. See prd/homepage-session-aware-revamp.md Section 11.
function AnonymousHome({ exams }: { exams: ExamCardData[] }) {
  return (
    <main>
      <Hero />
      <FeatureStrip />
      <ExploreExams exams={exams} trendingSlug={FEATURED_ANONYMOUS_EXAM_SLUG} />
      <MasterConcepts />
      <PracticeShowcase />
      <FrameworkSteps />
      <Team />
      <CtaBand />
    </main>
  );
}

// Section 6 — logged in, but not yet onboarded or missing a primary exam target.
function IncompleteProfileHome({
  firstName,
  needsOnboarding,
  exams,
}: {
  firstName: string;
  needsOnboarding: boolean;
  exams: ExamCardData[];
}) {
  return (
    <main>
      <section className="bg-background py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-headline-lg text-foreground">Welcome, {firstName} — let&apos;s find your exam.</h1>
        </div>
      </section>

      <div className="pb-8">
        <IncompleteProfileBanner needsOnboarding={needsOnboarding} />
      </div>

      <ExploreExams exams={exams} trendingSlug={FEATURED_ANONYMOUS_EXAM_SLUG} />
      <FrameworkSteps />
      <Team />
      <CtaBand variant="incomplete-profile" />
    </main>
  );
}

interface ExamTarget {
  examId: string;
  examName: string;
  examSlug: string;
  isPrimary: boolean;
}

// Cross-references the small set of open mocks against attempts already fetched (no new
// query for "did I attempt this") and only calls the (heavier) per-assessment report for
// ones actually submitted, to find this user's rank within it.
async function buildOpenMockEntries(
  userId: string,
  examTargets: ExamTarget[],
  myAttempts: Awaited<ReturnType<typeof assessmentRepository.listMyAttempts>>
): Promise<OpenMockEntry[]> {
  const openMocks = await assessmentRepository.findOpenMocksForExams(
    examTargets.map((t) => t.examId),
    5
  );
  if (openMocks.length === 0) return [];

  const examNameByExamId = new Map(examTargets.map((t) => [t.examId, t.examName]));
  const attemptByAssessmentId = new Map(myAttempts.map((row) => [row.assessment.id, row.attempt]));

  return Promise.all(
    openMocks.map(async (mock): Promise<OpenMockEntry> => {
      const examName = (mock.examId && examNameByExamId.get(mock.examId)) || '';
      const attempt = attemptByAssessmentId.get(mock.id);
      const attempted = attempt?.status === 'SUBMITTED';

      if (!attempted) {
        return { id: mock.id, title: mock.title, examName, durationSeconds: mock.durationSeconds, attempted: false };
      }

      const report = await assessmentRepository.getAssessmentReport(mock.id);
      const mine = report.ranking.find((r) => r.userId === userId);
      return {
        id: mock.id,
        title: mock.title,
        examName,
        durationSeconds: mock.durationSeconds,
        attempted: true,
        rank: mine?.rank,
        totalRanked: report.ranking.length,
        percentage: mine?.percentage,
      };
    })
  );
}

// Section 7 — the primary deliverable: a personalized home for a fully onboarded user
// with a primary exam target.
async function PersonalizedHome({
  userId,
  firstName,
  primaryTarget,
  examTargets,
}: {
  userId: string;
  firstName: string;
  primaryTarget: ExamTarget;
  examTargets: ExamTarget[];
}) {
  // All independent reads, fired together rather than as sequential waterfalls (Section 11).
  const [progressGroups, myAttempts, hotArticles, subjectsTree, otherExamsRaw] = await Promise.all([
    assessmentRepository.getUserProgress(userId, 'exam'),
    assessmentRepository.listMyAttempts(userId),
    articleRepository.findPublishedByExam(primaryTarget.examId),
    taxonomyRepository.getSyllabusTree(primaryTarget.examId),
    getFeaturedExams(6),
  ]);

  const primaryProgress = progressGroups.find((g) => g.meta === primaryTarget.examSlug) ?? null;
  const inProgressRow = myAttempts.find((row) => row.attempt.status === 'IN_PROGRESS');
  const otherExams = otherExamsRaw.filter((e) => e.id !== primaryTarget.examId);
  const openMocks = await buildOpenMockEntries(userId, examTargets, myAttempts);

  return (
    <main>
      <LoggedInHero
        firstName={firstName}
        examName={primaryTarget.examName}
        examSlug={primaryTarget.examSlug}
        progress={primaryProgress}
      />

      {inProgressRow && (
        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
          <ContinueMockCard
            assessmentId={inProgressRow.assessment.id}
            title={inProgressRow.assessment.title}
            durationSeconds={inProgressRow.assessment.durationSeconds}
          />
        </div>
      )}

      <HotTopics articles={hotArticles} examName={primaryTarget.examName} />

      <PracticeShortcuts
        examSlug={primaryTarget.examSlug}
        subjects={subjectsTree.map((s) => ({ id: s.id, name: s.name }))}
        exams={examTargets.map((t) => ({ examSlug: t.examSlug, examName: t.examName }))}
      />

      <MockPromptCard />

      <OpenMocksPanel mocks={openMocks} />

      <CoursesComingSoonCard examName={primaryTarget.examName} />

      {otherExams.length > 0 && (
        <ExploreExams
          exams={otherExams}
          heading="Explore Other Exams"
          description="Branch out — every exam gets the same structured theory, practice, and mocks."
        />
      )}
    </main>
  );
}

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    return <AnonymousHome exams={await getFeaturedExams()} />;
  }

  const [snapshot, examTargets] = await Promise.all([
    userRepository.getAuthorizationSnapshot(session.user.id),
    userRepository.findExamTargetsByUserId(session.user.id),
  ]);

  // A session cookie can outlive the account it points at (deleted/disabled mid-session) —
  // treat that the same as anonymous rather than crash on a null snapshot.
  if (!snapshot) {
    return <AnonymousHome exams={await getFeaturedExams()} />;
  }

  const primaryTarget = examTargets.find((t) => t.isPrimary) ?? null;
  const firstName = session.user.name?.split(' ')[0] ?? 'there';

  if (!snapshot.onboardingCompleted || !primaryTarget) {
    return (
      <IncompleteProfileHome
        firstName={firstName}
        needsOnboarding={!snapshot.onboardingCompleted}
        exams={await getFeaturedExams()}
      />
    );
  }

  return (
    <PersonalizedHome userId={session.user.id} firstName={firstName} primaryTarget={primaryTarget} examTargets={examTargets} />
  );
}
