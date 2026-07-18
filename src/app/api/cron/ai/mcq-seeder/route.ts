import { requireCronSecretOrAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { runMCQSeederBatch } from '@/server/services/ai/jobs/mcq-seeder.job';

export async function POST(req: Request) {
  const error = await requireCronSecretOrAuth(req);
  if (error) return error;

  const result = await runMCQSeederBatch();
  return apiSuccess(result);
}
