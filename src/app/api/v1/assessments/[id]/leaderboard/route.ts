import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { apiError, apiSuccess } from '@/lib/utils';

// Any participant with access (not just the organizer) — names/scores/ranks only, never
// emails or other participants' answers. Confirmed product decision: group-test
// leaderboards are visible to everyone in the test, unlike the organizer-only roster.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const assessment = await assessmentRepository.findById(id);
  if (!assessment) return apiError('Not found', 404);

  const allowed = await assessmentRepository.checkAccess(id, session!.user.id, session!.user.role);
  if (!allowed) return apiError('Not found', 404);

  const report = await assessmentRepository.getAssessmentReport(id);
  return apiSuccess({
    totalQuestions: report.totalQuestions,
    participantCount: report.participantCount,
    completedCount: report.completedCount,
    averageScore: report.averageScore,
    highestScore: report.highestScore,
    ranking: report.ranking.map((r) => ({
      userId: r.userId,
      name: r.name,
      rank: r.rank,
      score: r.score,
      percentage: r.percentage,
      accuracy: r.accuracy,
      timeSpentSeconds: r.timeSpentSeconds,
    })),
  });
}
