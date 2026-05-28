import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { getMongoDb } from '@/lib/mongodb';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: examId } = await params;
  const exam = await examRepository.findById(examId);
  if (!exam) return apiError('Exam not found', 404);

  const { searchParams } = new URL(req.url);
  const forUser = searchParams.get('forUser') === 'true';

  const coverage = await examRepository.getSectionCoverage(examId);
  const sections = await examRepository.getSectionsByExam(examId);

  if (!forUser) {
    return apiSuccess(coverage);
  }

  const userId = session!.user.id;
  const db = await getMongoDb();
  const topicIds = [...new Set(sections.map((s) => s.topicId))];

  const [mockDocs, testDocs, mcqDocs] = await Promise.all([
    db.collection('mockSessions').find({ userId, status: 'SUBMITTED' }).toArray(),
    db.collection('testAttempts').find({ userId, status: 'EVALUATED' }).toArray(),
    db.collection('mcqs').find({ examIds: examId, isActive: true }, { projection: { id: 1, topicId: 1 } }).toArray(),
  ]);

  const mcqTopicMap = new Map<string, string>();
  for (const doc of mcqDocs) {
    mcqTopicMap.set(doc.id as string, doc.topicId as string);
  }

  const topicStats = new Map<string, { attempted: number; correct: number; lastAt: string }>();

  const processResponses = (
    responses: Array<{ mcqId: string; isCorrect: boolean }>,
    submittedAt: string
  ) => {
    for (const r of responses) {
      const topicId = mcqTopicMap.get(r.mcqId);
      if (!topicId || !topicIds.includes(topicId)) continue;
      const curr = topicStats.get(topicId) ?? { attempted: 0, correct: 0, lastAt: '' };
      topicStats.set(topicId, {
        attempted: curr.attempted + 1,
        correct: curr.correct + (r.isCorrect ? 1 : 0),
        lastAt: submittedAt > curr.lastAt ? submittedAt : curr.lastAt,
      });
    }
  };

  for (const doc of mockDocs) {
    processResponses(
      (doc.responses as Array<{ mcqId: string; isCorrect: boolean }>) ?? [],
      (doc.submittedAt as string) ?? (doc.createdAt as string) ?? ''
    );
  }
  for (const doc of testDocs) {
    processResponses(
      (doc.responses as Array<{ mcqId: string; isCorrect: boolean }>) ?? [],
      (doc.submittedAt as string) ?? ''
    );
  }

  const result = sections.map((section) => {
    const mcqCoverage = coverage.find((c) => c.sectionId === section.id);
    const stats = topicStats.get(section.topicId);
    return {
      sectionId: section.id,
      topicId: section.topicId,
      subjectId: section.subjectId,
      displayName: section.displayName,
      mcqCount: mcqCoverage?.mcqCount ?? 0,
      attempted: stats?.attempted ?? 0,
      correct: stats?.correct ?? 0,
      accuracy: stats ? Math.round((stats.correct / stats.attempted) * 100) : null,
      lastAttemptedAt: stats?.lastAt ?? null,
    };
  });

  return apiSuccess(result);
}
