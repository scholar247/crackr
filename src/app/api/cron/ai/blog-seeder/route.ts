import { requireCronSecretOrAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { runBlogSeederBatch } from '@/server/services/ai/jobs/blog-seeder.job';

export async function POST(req: Request) {
  const error = await requireCronSecretOrAuth(req);
  if (error) return error;

  const result = await runBlogSeederBatch();
  return apiSuccess(result);
}
