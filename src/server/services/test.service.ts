import { testRepository } from '@/server/repositories/test.repository';
import { mcqRepository } from '@/server/repositories/mcq.repository';
import { userRepository } from '@/server/repositories/user.repository';
import type { CreateTestInput, UpdateTestInput, SubmitAttemptInput } from '@/schemas';
import type { TestAttemptClient } from '@/types';
import { shuffle } from '@/lib/utils';

export const testService = {
  async getForUser(userId: string) {
    const user = await userRepository.findById(userId);
    return testRepository.findForUser(userId, user?.groupIds ?? []);
  },

  async getById(id: string) {
    return testRepository.findById(id);
  },

  async create(data: CreateTestInput, createdBy: string) {
    return testRepository.create(data, createdBy);
  },

  async update(id: string, data: UpdateTestInput) {
    return testRepository.update(id, data);
  },

  async startAttempt(testId: string, userId: string) {
    // Prevent duplicate in-progress attempts
    const existing = await testRepository.findUserAttempt(testId, userId);
    if (existing) return existing;

    const test = await testRepository.findById(testId);
    if (!test) throw new Error('Test not found');

    const mcqIds = test.shuffleQuestions ? shuffle(test.mcqIds) : test.mcqIds;

    return testRepository.startAttempt(testId, userId, mcqIds);
  },

  async submitAttempt(attemptId: string, data: SubmitAttemptInput, userId: string) {
    const attempt = await testRepository.findAttempt(attemptId);
    if (!attempt || attempt.userId !== userId) throw new Error('Attempt not found');
    if (attempt.status !== 'IN_PROGRESS') throw new Error('Attempt already submitted');

    const test = await testRepository.findById(attempt.testId);
    if (!test) throw new Error('Test not found');

    // Load all MCQs to evaluate
    const mcqs = await mcqRepository.findByIds(attempt.shuffledMcqIds ?? test.mcqIds);
    const mcqMap = new Map(mcqs.map((m) => [m.id, m]));

    let marksObtained = 0;
    const responses: TestAttemptClient['responses'] = data.responses.map((r) => {
      const mcq = mcqMap.get(r.mcqId);
      if (!mcq) {
        return {
          mcqId: r.mcqId,
          selectedOptionIds: r.selectedOptionIds,
          isCorrect: false,
          marksAwarded: 0,
          timeTakenSeconds: r.timeTakenSeconds,
        };
      }

      const correctIds = mcq.options.filter((o) => o.isCorrect).map((o) => o.id);
      const isCorrect =
        correctIds.length === r.selectedOptionIds.length &&
        correctIds.every((id) => r.selectedOptionIds.includes(id));

      // Marks per question — divide totalMarks equally if no per-question marks
      const marksPerQ = test.totalMarks / test.mcqIds.length;
      let marksAwarded = 0;

      if (isCorrect) {
        marksAwarded = marksPerQ;
      } else if (
        r.selectedOptionIds.length > 0 &&
        test.negativeMarking
      ) {
        marksAwarded = -test.negativeMarkValue;
      }

      marksObtained += marksAwarded;

      return {
        mcqId: r.mcqId,
        selectedOptionIds: r.selectedOptionIds,
        isCorrect,
        marksAwarded,
        timeTakenSeconds: r.timeTakenSeconds,
      };
    });

    marksObtained = Math.max(0, marksObtained);

    return testRepository.submitAttempt(attemptId, data, {
      responses,
      marksObtained,
      totalMarks: test.totalMarks,
    });
  },

  async getResults(testId: string, userId: string) {
    return testRepository.findUserAttempt(testId, userId);
  },

  async getAnalytics(testId: string) {
    const test = await testRepository.findById(testId);
    if (!test) return null;

    const attempts = await testRepository.getTestAttempts(testId);
    if (attempts.length === 0) return { test, attempts: [], stats: null };

    const scores = attempts.map((a) => a.marksObtained / a.totalMarks * 100);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const passRate = attempts.filter((a) => a.marksObtained >= test.passMark).length / attempts.length * 100;
    const completionRate = 100; // All in set are submitted

    // Per-question analysis
    const questionStats = (test.mcqIds ?? []).map((mcqId) => {
      const responses = attempts.flatMap((a) => a.responses.filter((r) => r.mcqId === mcqId));
      const correct = responses.filter((r) => r.isCorrect).length;
      return {
        mcqId,
        totalResponses: responses.length,
        correctCount: correct,
        pctCorrect: responses.length > 0 ? (correct / responses.length) * 100 : 0,
      };
    });

    // Leaderboard
    const leaderboard = attempts
      .map((a, i) => ({
        userId: a.userId,
        score: a.marksObtained,
        totalMarks: a.totalMarks,
        percentage: (a.marksObtained / a.totalMarks) * 100,
        timeTakenSeconds: a.timeTakenSeconds,
        submittedAt: a.submittedAt,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    // Score distribution (10 buckets)
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${(i + 1) * 10}%`,
      count: 0,
    }));
    scores.forEach((s) => {
      const idx = Math.min(Math.floor(s / 10), 9);
      buckets[idx].count++;
    });

    return {
      test,
      stats: {
        avgScore,
        passRate,
        completionRate,
        totalAttempts: attempts.length,
        scoreDistribution: buckets,
      },
      questionStats,
      leaderboard,
    };
  },
};
