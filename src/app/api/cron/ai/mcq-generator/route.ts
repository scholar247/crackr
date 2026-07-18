import { requireCronSecretOrAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { runMCQGeneratorBatch } from '@/server/services/ai/jobs/mcq-generator.job';

export async function POST(req: Request) {
  const error = await requireCronSecretOrAuth(req);
  if (error) return error;

  const result = await runMCQGeneratorBatch();
  return apiSuccess(result);
}
