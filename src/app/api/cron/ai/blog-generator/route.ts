import { requireCronSecretOrAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { runBlogGeneratorBatch } from '@/server/services/ai/jobs/blog-generator.job';

export async function POST(req: Request) {
  const error = await requireCronSecretOrAuth(req);
  if (error) return error;

  const result = await runBlogGeneratorBatch();
  return apiSuccess(result);
}
