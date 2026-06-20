import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { mcqService } from '@/server/services/mcq.service';
import { CreateMCQSchema, MCQListQuerySchema } from '@/schemas';

export async function GET(req: Request) {
  const { session, error } = await requireAuth('EDITOR');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const parsed = MCQListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query params' }, { status: 400 });
  }

  const result = await mcqService.list(parsed.data);
  return apiSuccess(result.items, {
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth('EDITOR');
  if (error) return error;

  const body = await req.json();
  const parsed = CreateMCQSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const mcq = await mcqService.create(parsed.data, session!.user.id, session!.user.email ?? 'join.scholar247@gmail.com');
  return apiSuccess(mcq, undefined, 201);
}
