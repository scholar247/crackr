import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { PlanSeedsSchema } from '@/schemas/ai-seed.schema';
import { planSeeds } from '@/server/services/ai/planner.service';

export async function POST(req: Request) {
  const { session, error } = await requireAuth('EDITOR');
  if (error) return error;

  const parsed = PlanSeedsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await planSeeds(parsed.data, session!.user.id, session!.user.email ?? '');
  return apiSuccess(result, undefined, 201);
}
