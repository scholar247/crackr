import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { pypRepository } from '@/server/repositories/pyp.repository';
import { AddMCQsToPYPSchema } from '@/schemas';

interface Params { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = AddMCQsToPYPSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const pyp = await pypRepository.findById(id);
    if (!pyp) return apiError('PYP not found', 404);

    const updated = await pypRepository.addMCQs(id, parsed.data.mcqIds, pyp.title);
    return apiSuccess(updated);
  } catch (err) {
    console.error('[admin/pyp/mcqs POST]', err);
    return apiError('Internal server error', 500);
  }
}
