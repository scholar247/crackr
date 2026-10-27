import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { apiError } from '@/lib/utils';

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

const HEADERS = ['Rank', 'Name', 'Email', 'Score', 'Percentage', 'Accuracy', 'Attempted', 'Correct', 'Wrong', 'Unattempted', 'Time Spent (s)', 'Status'] as const;

// Organizer/admin only — CSV of the ranked report, same data as GET .../report.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const assessment = await assessmentRepository.findById(id);
  if (!assessment) return apiError('Not found', 404);
  if (assessment.creatorUserId !== session!.user.id && !isAdmin(session!.user.role)) return apiError('Forbidden', 403);

  const report = await assessmentRepository.getAssessmentReport(id);
  const lines = [
    HEADERS.join(','),
    ...report.ranking.map((r) =>
      [r.rank, r.name ?? '', r.email, r.score, r.percentage, r.accuracy, r.attempted, r.correct, r.wrong, r.unattempted, r.timeSpentSeconds, r.status]
        .map(csvCell)
        .join(','),
    ),
  ];
  const csv = lines.join('\n');

  const filename = `${assessment.title.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}-results.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
