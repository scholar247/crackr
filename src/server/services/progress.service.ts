import { getMongoDb } from '@/lib/mongodb';
import type {
  ProgressData,
  ProgressSummary,
  ScoreTrendPoint,
  SubjectProficiency,
  DifficultyBreakdown,
  TopicStats,
  WeakArea,
  ActivityFeedItem,
  TestAttemptClient,
  MockSessionClient,
} from '@/types';
import type { ProgressQuery } from '@/schemas';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { mcqRepository } from '@/server/repositories/mcq.repository';

export const progressService = {
  async getProgress(userId: string, query: ProgressQuery): Promise<ProgressData> {
    const db = await getMongoDb();
    const from = query.from ? new Date(query.from) : new Date(Date.now() - 90 * 86400000);
    const to = query.to ? new Date(query.to) : new Date();
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    const subjectFilter = query.subjectIds ? query.subjectIds.split(',').filter(Boolean) : [];

    // Fetch test attempts
    let testAttempts: TestAttemptClient[] = [];
    if (query.type !== 'mocks') {
      const docs = await db
        .collection('testAttempts')
        .find({ userId, status: 'EVALUATED', submittedAt: { $gte: fromIso, $lte: toIso } })
        .sort({ submittedAt: -1 })
        .toArray();
      testAttempts = docs.map(({ _id, ...d }) => d as unknown as TestAttemptClient);
    }

    // Fetch mock sessions
    let mockSessions: MockSessionClient[] = [];
    if (query.type !== 'tests') {
      const docs = await db
        .collection('mockSessions')
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
      mockSessions = docs
        .map(({ _id, ...d }) => d as unknown as MockSessionClient)
        .filter((s) => {
          if (!s.attempt) return false;
          const date = new Date(s.attempt.submittedAt ?? '');
          return date >= from && date <= to;
        });
    }

    const allAttempts = [
      ...testAttempts.map((a) => ({ type: 'test' as const, attempt: a, date: a.submittedAt ?? '' })),
      ...mockSessions.map((s) => ({ type: 'mock' as const, attempt: s.attempt!, date: s.attempt?.submittedAt ?? '' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalAttempts = allAttempts.length;

    // Summary
    const avgScore =
      totalAttempts > 0
        ? allAttempts.reduce((sum, { attempt }) => {
            return sum + (attempt.marksObtained / attempt.totalMarks) * 100;
          }, 0) / totalAttempts
        : 0;

    // Streak
    const attemptDates = [...new Set(allAttempts.map(({ date }) => date.slice(0, 10)))].sort().reverse();
    let bestStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;
    for (const d of attemptDates) {
      const current = new Date(d);
      if (!prevDate) {
        currentStreak = 1;
      } else {
        const diff = (prevDate.getTime() - current.getTime()) / 86400000;
        if (diff <= 1.5) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      prevDate = current;
    }

    // Improvement trend
    let improvementTrend: 'up' | 'down' | 'stable' = 'stable';
    if (allAttempts.length >= 4) {
      const mid = Math.floor(allAttempts.length / 2);
      const recent = allAttempts.slice(0, mid);
      const older = allAttempts.slice(mid);
      const recentAvg = recent.reduce((s, { attempt }) => s + attempt.marksObtained / attempt.totalMarks, 0) / recent.length;
      const olderAvg = older.reduce((s, { attempt }) => s + attempt.marksObtained / attempt.totalMarks, 0) / older.length;
      if (recentAvg > olderAvg + 0.03) improvementTrend = 'up';
      else if (recentAvg < olderAvg - 0.03) improvementTrend = 'down';
    }

    const summary: ProgressSummary = {
      totalAttempts,
      avgScore: Math.round(avgScore * 10) / 10,
      bestStreak,
      improvementTrend,
    };

    // Score trend
    const scoreTrend: ScoreTrendPoint[] = allAttempts.slice(0, 30).reverse().map(({ type, attempt, date }) => ({
      date: date.slice(0, 10),
      score: Math.round((attempt.marksObtained / attempt.totalMarks) * 1000) / 10,
      type,
      label: type === 'mock' ? 'Mock Test' : 'Assigned Test',
    }));

    // Subjects for enrichment
    const subjects = await subjectRepository.findAll(false);
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    // MCQ-level analysis
    const mcqIds = [...new Set(allAttempts.flatMap(({ attempt }) => attempt.responses.map((r) => r.mcqId)))].slice(0, 100);
    const mcqs = await mcqRepository.findByIds(mcqIds);
    const mcqMap = new Map(mcqs.map((m) => [m.id, m]));

    // Subject proficiency
    const subjectScores = new Map<string, { correct: number; total: number }>();
    for (const { attempt } of allAttempts) {
      for (const r of attempt.responses) {
        const mcq = mcqMap.get(r.mcqId);
        if (!mcq) continue;
        if (subjectFilter.length > 0 && !subjectFilter.includes(mcq.subjectId)) continue;
        const cur = subjectScores.get(mcq.subjectId) ?? { correct: 0, total: 0 };
        subjectScores.set(mcq.subjectId, {
          correct: cur.correct + (r.isCorrect ? 1 : 0),
          total: cur.total + 1,
        });
      }
    }

    const subjectProficiency: SubjectProficiency[] = Array.from(subjectScores.entries())
      .map(([subjectId, { correct, total }]) => ({
        subjectId,
        subjectName: subjectMap.get(subjectId)?.name ?? subjectId,
        proficiency: total > 0 ? Math.round((correct / total) * 100) : 0,
      }));

    // Difficulty breakdown per subject
    const diffMap = new Map<string, Record<string, { correct: number; total: number }>>();
    for (const { attempt } of allAttempts) {
      for (const r of attempt.responses) {
        const mcq = mcqMap.get(r.mcqId);
        if (!mcq) continue;
        const subName = subjectMap.get(mcq.subjectId)?.name ?? mcq.subjectId;
        if (!diffMap.has(subName)) {
          diffMap.set(subName, {
            EASY: { correct: 0, total: 0 },
            MEDIUM: { correct: 0, total: 0 },
            HARD: { correct: 0, total: 0 },
            EXPERT: { correct: 0, total: 0 },
          });
        }
        const diff = mcq.difficulty;
        const subDiff = diffMap.get(subName)!;
        subDiff[diff].total++;
        if (r.isCorrect) subDiff[diff].correct++;
      }
    }

    const difficultyBreakdown: DifficultyBreakdown[] = Array.from(diffMap.entries()).map(([subjectName, diffs]) => ({
      subjectName,
      EASY: diffs.EASY.total > 0 ? Math.round((diffs.EASY.correct / diffs.EASY.total) * 100) : 0,
      MEDIUM: diffs.MEDIUM.total > 0 ? Math.round((diffs.MEDIUM.correct / diffs.MEDIUM.total) * 100) : 0,
      HARD: diffs.HARD.total > 0 ? Math.round((diffs.HARD.correct / diffs.HARD.total) * 100) : 0,
      EXPERT: diffs.EXPERT.total > 0 ? Math.round((diffs.EXPERT.correct / diffs.EXPERT.total) * 100) : 0,
    }));

    // Topic stats
    const topicMap = new Map<string, { correct: number; total: number; totalTime: number; name: string; subjectName: string }>();
    for (const { attempt } of allAttempts) {
      for (const r of attempt.responses) {
        const mcq = mcqMap.get(r.mcqId);
        if (!mcq) continue;
        // Use last element of topicPath (most specific topic), fallback to topicId
        const topicId = mcq.topicId;
        const topicName = mcq.topicPathNames?.[mcq.topicPathNames.length - 1] ?? topicId;
        const subjectName = subjectMap.get(mcq.subjectId)?.name ?? '';
        const cur = topicMap.get(topicId) ?? { correct: 0, total: 0, totalTime: 0, name: topicName, subjectName };
        topicMap.set(topicId, {
          correct: cur.correct + (r.isCorrect ? 1 : 0),
          total: cur.total + 1,
          totalTime: cur.totalTime + r.timeTakenSeconds,
          name: topicName,
          subjectName,
        });
      }
    }

    const topicStats: TopicStats[] = Array.from(topicMap.entries())
      .map(([topicId, stats]) => ({
        topicId,
        topicName: stats.name,
        subjectName: stats.subjectName,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        attempted: stats.total,
        avgTimeSeconds: stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0,
      }))
      .sort((a, b) => b.attempted - a.attempted);

    // Weak areas (bottom 5 topics by accuracy with ≥5 attempts)
    const weakAreas: WeakArea[] = topicStats
      .filter((t) => t.attempted >= 5)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)
      .map((t) => ({
        topicId: t.topicId,
        topicName: t.topicName,
        subjectName: t.subjectName,
        accuracy: t.accuracy,
        attempted: t.attempted,
      }));

    // Recent activity
    const recentActivity: ActivityFeedItem[] = allAttempts.slice(0, 10).map(({ type, attempt, date }) => ({
      id: attempt.id,
      type,
      title: type === 'mock' ? 'Mock Test' : 'Assigned Test',
      score: attempt.marksObtained,
      totalMarks: attempt.totalMarks,
      completedAt: date,
    }));

    return {
      summary,
      scoreTrend,
      subjectProficiency,
      difficultyBreakdown,
      topicStats,
      weakAreas,
      recentActivity,
    };
  },
};
