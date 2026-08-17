import { requireAuth } from '@/server/auth/require-auth';
import { questionRepository } from '@/server/repositories/question.repository';
import { CreateQuestionSchema } from '@/schemas/question.schema';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET(req: Request) {
  const { error } = await requireAuth('TEACHER');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId') ?? undefined;
  const status = searchParams.get('status') as 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | null;
  const difficulty = searchParams.get('difficulty') as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | null;
  const search = searchParams.get('search') ?? undefined;
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? limitParam : 10;
  const pageParam = Number(searchParams.get('page'));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const { rows, total } = await questionRepository.list({
    examId,
    status: status ?? undefined,
    difficulty: difficulty ?? undefined,
    search,
    limit,
    page,
  });
  return apiSuccess(rows, { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

export async function POST(req: Request) {
  const { session, error, isServiceKey } = await requireAuth('TEACHER');
  if (error) return error;

  const parsed = CreateQuestionSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const authorId = isServiceKey ? null : session!.user.id;
  const question = await questionRepository.create(parsed.data, authorId);
  return apiSuccess(question, undefined, 201);
}
