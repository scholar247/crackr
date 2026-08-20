import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const CreateExamSchema = z.object({
  programId: z.uuid(),
  name: z.string().min(2).max(160),
  description: z.string().max(500).optional(),
  thumbnailUrl: z.url().max(2048).optional(),
});

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const rows = await taxonomyRepository.listExams();
  return apiSuccess(rows.map(({ exam, programName }) => ({ ...exam, programName })));
}

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = CreateExamSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const exam = await taxonomyRepository.createExam(parsed.data);
  return apiSuccess(exam, undefined, 201);
}
