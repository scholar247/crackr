import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { mcqRepository } from '@/server/repositories/mcq.repository';
import { MCQListQuerySchema } from '@/schemas';

export async function GET(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const parsed = MCQListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid filters' }, { status: 400 });
  }

  const count = await mcqRepository.countMCQs(parsed.data);
  return apiSuccess({ count });
}
