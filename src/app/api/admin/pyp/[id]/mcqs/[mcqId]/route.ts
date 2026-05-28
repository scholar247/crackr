import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { pypRepository } from '@/server/repositories/pyp.repository';

interface Params { params: Promise<{ id: string; mcqId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id, mcqId } = await params;
  try {
    const updated = await pypRepository.removeMCQ(id, mcqId);
    if (!updated) return apiError('PYP not found', 404);
    return apiSuccess(updated);
  } catch (err) {
    console.error('[admin/pyp/mcqs DELETE]', err);
    return apiError('Internal server error', 500);
  }
}
