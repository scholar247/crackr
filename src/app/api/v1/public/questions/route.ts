import { questionRepository } from '@/server/repositories/question.repository';
import { apiSuccess } from '@/lib/utils';

// No auth — same convention as /api/v1/public/exams: PUBLISHED + PUBLIC content is safe
// to serve to anyone. Powers the practice browser, which itself sits behind login (proxy.ts
// gates /practice regardless of route group), but the endpoint doesn't need to know that.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId') ?? undefined;
  const nodeId = searchParams.get('nodeId') ?? undefined;
  const difficulty = searchParams.get('difficulty') as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | null;
  const sort = searchParams.get('sort') as 'newest' | 'oldest' | 'difficulty_asc' | 'difficulty_desc' | null;

  const rows = await questionRepository.listPublished({
    examId,
    nodeId,
    difficulty: difficulty ?? undefined,
    sort: sort ?? undefined,
  });
  return apiSuccess(rows);
}
