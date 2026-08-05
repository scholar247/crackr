import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const CreateNodeSchema = z.object({
  nodeType: z.enum(['SUBJECT', 'CHAPTER', 'TOPIC', 'SUBTOPIC']),
  name: z.string().min(2).max(160),
  parentNodeId: z.uuid().optional(),
  examId: z.uuid().optional(),
});

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  return apiSuccess(await taxonomyRepository.listNodes());
}

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = CreateNodeSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const node = await taxonomyRepository.createNode(parsed.data);
  return apiSuccess(node, undefined, 201);
}
