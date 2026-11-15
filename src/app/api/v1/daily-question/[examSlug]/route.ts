import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { getStreakMonth, getStreakSummary, submitDailyAnswer } from '@/server/services/daily-streak';
import { apiError, apiSuccess } from '@/lib/utils';

type Ctx = { params: Promise<{ examSlug: string }> };

async function activeExam(slug: string) {
  const exam = await taxonomyRepository.findExamBySlug(slug);
  return exam && exam.status === 'ACTIVE' ? exam : null;
}

// GET /api/v1/daily-question/{examSlug}              — streak summary + this month's calendar
// GET /api/v1/daily-question/{examSlug}?month=YYYY-MM — one calendar month (≤ 31 days)
export async function GET(req: Request, { params }: Ctx) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const month = new URL(req.url).searchParams.get('month');
  if (month !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return apiError('month must be YYYY-MM', 400);

  const exam = await activeExam((await params).examSlug);
  if (!exam) return apiError('Exam not found', 404);
  return apiSuccess(month ? await getStreakMonth(session!.user.id, exam.id, month) : await getStreakSummary(session!.user.id, exam.id));
}

const SubmitSchema = z
  .object({
    questionId: z.number().int().positive(),
    selected: z.string().trim().min(1).max(8),
  })
  .strict();

// POST /api/v1/daily-question/{examSlug} — submit today's answer (sign-in required).
// Returns the updated streak. Correctness is decided here; a repeat submit the same day
// keeps the first answer and reports alreadyAnswered.
export async function POST(req: Request, { params }: Ctx) {
  const { session, error, isServiceKey } = await requireAuth();
  if (error) return error;
  // Streaks belong to real students, not the seed/service key.
  if (isServiceKey) return apiError('Sign in to save your streak', 403);

  const exam = await activeExam((await params).examSlug);
  if (!exam) return apiError('Exam not found', 404);

  const parsed = SubmitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const result = await submitDailyAnswer(session!.user.id, exam.id, parsed.data.questionId, parsed.data.selected);
  if (!result.ok) return apiError(result.error, result.status);
  return apiSuccess({ summary: result.summary, isCorrect: result.isCorrect, alreadyAnswered: result.alreadyAnswered });
}
