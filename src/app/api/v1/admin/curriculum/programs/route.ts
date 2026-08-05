import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const CreateProgramSchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  return apiSuccess(await taxonomyRepository.listPrograms());
}

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = CreateProgramSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const program = await taxonomyRepository.createProgram(parsed.data);
  return apiSuccess(program, undefined, 201);
}
