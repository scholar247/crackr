import { mockRepository } from '@/server/repositories/mock.repository';
import { mcqRepository } from '@/server/repositories/mcq.repository';
import type { GenerateMockInput, SubmitAttemptInput } from '@/schemas';
import type { MockSessionClient, TestAttemptClient } from '@/types';
import { mcqRepository as mcqRepo } from '@/server/repositories/mcq.repository';

export const mockService = {
  async generate(userId: string, input: GenerateMockInput): Promise<MockSessionClient> {
    const { filters } = input;

    const mcqIds = await mcqRepository.randomSelect({
      subjectIds: filters.subjectIds,
      topicIds: filters.topicIds,
      examId: filters.examId,
      examSectionIds: filters.examSectionIds,
      tagIds: filters.tagIds,
      difficulty: filters.difficulty,
      isPreviousYear: filters.includePreviousYear ? true : undefined,
      count: filters.questionCount,
    });

    if (mcqIds.length === 0) {
      throw new Error('No questions found matching the selected filters');
    }

    return mockRepository.create(userId, filters, mcqIds);
  },

  async getById(id: string, userId: string): Promise<MockSessionClient | null> {
    const session = await mockRepository.findById(id);
    if (!session || session.userId !== userId) return null;
    return session;
  },

  async getUserMocks(userId: string, opts?: { page?: number; pageSize?: number }) {
    return mockRepository.findByUser(userId, opts);
  },

  async submit(sessionId: string, userId: string, data: SubmitAttemptInput): Promise<MockSessionClient | null> {
    const session = await mockRepository.findById(sessionId);
    if (!session || session.userId !== userId) throw new Error('Session not found');
    if (session.attempt) throw new Error('Mock already submitted');

    // Load MCQs and evaluate
    const mcqs = await mcqRepository.findByIds(session.mcqIds);
    const mcqMap = new Map(mcqs.map((m) => [m.id, m]));

    let marksObtained = 0;
    const totalMarks = mcqs.length; // 1 mark per question

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

      const marksAwarded = isCorrect ? 1 : 0;
      marksObtained += marksAwarded;

      return {
        mcqId: r.mcqId,
        selectedOptionIds: r.selectedOptionIds,
        isCorrect,
        marksAwarded,
        timeTakenSeconds: r.timeTakenSeconds,
      };
    });

    const attempt: TestAttemptClient = {
      id: `mock_${sessionId}`,
      testId: sessionId,
      userId,
      responses,
      totalMarks,
      marksObtained,
      timeTakenSeconds: data.timeTakenSeconds,
      status: 'EVALUATED',
      startedAt: session.createdAt,
      submittedAt: new Date().toISOString(),
    };

    await mcqRepository.incrementUsage(session.mcqIds);

    return mockRepository.attachAttempt(sessionId, attempt);
  },
};
