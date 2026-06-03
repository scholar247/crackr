import { z } from 'zod';
import { requireApiKey } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { pypRepository } from '@/server/repositories/pyp.repository';

const Schema = z.object({
  mcqIds: z.array(z.string().min(1)).min(1),
});

interface Params { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const err = requireApiKey(req);
  if (err) return err;

  const { id } = await params;
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const pyp = await pypRepository.findById(id);
    if (!pyp) return apiError('PYP not found', 404);

    const updated = await pypRepository.addMCQs(id, parsed.data.mcqIds, pyp.title);
    return apiSuccess(updated);
  } catch (e) {
    console.error('[seed/pyps/mcqs]', e);
    return apiError('Failed to add MCQs', 500);
  }
}
