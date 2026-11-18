import { requireAuth } from '@/server/auth/require-auth';
import { samplePaperRepository } from '@/server/repositories/sample-paper.repository';
import { revalidateSamplePaperPages } from '@/server/services/sample-papers';
import { SamplePaperSchema } from '@/schemas/sample-paper.schema';
import { isDuplicateKeyError } from '@/server/db/helpers';
import { apiError, apiSuccess } from '@/lib/utils';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const existing = await samplePaperRepository.findById(id);
  if (!existing) return apiError('Not found', 404);

  // The form always submits the full record, so validate against the full schema.
  const parsed = SamplePaperSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  // Only a *move* to another exam needs that exam to be active; papers under an exam that
  // was archived later must stay editable (at least to unpublish them).
  if (parsed.data.examId !== existing.examId) {
    const eligible = await samplePaperRepository.listEligibleExams();
    if (!eligible.some((e) => e.id === parsed.data.examId)) return apiError('Sample papers are not enabled for this exam', 400);
  }

  try {
    const paper = await samplePaperRepository.update(id, parsed.data);
    revalidateSamplePaperPages();
    return apiSuccess(paper);
  } catch (err) {
    if (isDuplicateKeyError(err)) return apiError('A paper for this exam, year and subject already exists', 409);
    throw err;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const existing = await samplePaperRepository.findById(id);
  if (!existing) return apiError('Not found', 404);

  await samplePaperRepository.remove(id);
  revalidateSamplePaperPages();
  return apiSuccess({ id });
}
