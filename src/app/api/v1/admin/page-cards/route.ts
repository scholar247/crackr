import { requireAuth } from '@/server/auth/require-auth';
import { pageCardRepository } from '@/server/repositories/page-card.repository';
import { PageCardSchema } from '@/lib/page-card-schema';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;
  return apiSuccess(await pageCardRepository.listAll());
}

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = PageCardSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  return apiSuccess(await pageCardRepository.create(parsed.data), undefined, 201);
}
