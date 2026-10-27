import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const UpdateProgramSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  thumbnailUrl: z.url().max(2048).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const parsed = UpdateProgramSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const program = await taxonomyRepository.updateProgram(id, parsed.data);
  if (!program) return apiError('Not found', 404);

  return apiSuccess(program);
}
