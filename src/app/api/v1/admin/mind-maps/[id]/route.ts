import { requireAuth, DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import { mindMapRepository } from '@/server/repositories/mind-map.repository';
import { getEditorData, saveMindMap } from '@/server/services/mind-maps';
import { SaveMindMapSchema } from '@/schemas/mind-map.schema';
import { apiError, apiSuccess } from '@/lib/utils';

type Ctx = { params: Promise<{ id: string }> };

// GET — draft, chapter curriculum (for linking/sync) and the diff against the live version.
export async function GET(_req: Request, { params }: Ctx) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const data = await getEditorData((await params).id);
  if (!data) return apiError('Not found', 404);
  return apiSuccess(data);
}

// PUT — save the whole draft (fields + node tree). Never changes what's live.
export async function PUT(req: Request, { params }: Ctx) {
  const { session, error, isServiceKey } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = SaveMindMapSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { id } = await params;
  const result = await saveMindMap(id, parsed.data, isServiceKey ? DEFAULT_CONTENT_AUTHOR_ID : session!.user.id);
  if (!result.ok) return apiError(result.error, result.status);
  return apiSuccess(await getEditorData(id));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id } = await params;
  if (!(await mindMapRepository.findById(id))) return apiError('Not found', 404);
  await mindMapRepository.remove(id);
  return apiSuccess({ id });
}
