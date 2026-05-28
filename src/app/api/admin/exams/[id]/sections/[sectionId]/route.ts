import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { UpdateExamSectionSchema } from '@/schemas';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { sectionId } = await params;
  const body = await req.json();
  const parsed = UpdateExamSectionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const section = await examRepository.updateSection(sectionId, parsed.data);
  if (!section) return apiError('Section not found', 404);
  return apiSuccess(section);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { sectionId } = await params;
  await examRepository.deleteSection(sectionId);
  return apiSuccess({ deleted: true });
}
