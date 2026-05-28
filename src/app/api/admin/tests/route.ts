import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { testService } from '@/server/services/test.service';
import { testRepository } from '@/server/repositories/test.repository';
import { CreateTestSchema } from '@/schemas';

export async function GET(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const result = await testRepository.findAll({ page, pageSize });
  return apiSuccess(result.items, { total: result.total, page, pageSize });
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth('ADMIN');
  if (error) return error;

  const body = await req.json();
  const parsed = CreateTestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const test = await testService.create(parsed.data, session!.user.id);
  return apiSuccess(test, undefined, 201);
}
