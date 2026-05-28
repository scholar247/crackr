import { requireAuth } from '@/lib/api-helpers';
import { apiError, apiSuccess } from '@/lib/utils';
import { tagRepository } from '@/server/repositories/tag.repository';
import { CreateTagSchema, MergeTagsSchema } from '@/schemas';

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const tags = await tagRepository.findAll();
  return apiSuccess(tags);
}

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const body = await req.json();

  // Handle merge operation
  if (body.action === 'merge') {
    const parsed = MergeTagsSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    await tagRepository.mergeTags(parsed.data.sourceTagIds, parsed.data.targetTagId);
    return apiSuccess({ merged: true });
  }

  // Create new tag
  const parsed = CreateTagSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const tag = await tagRepository.create(parsed.data);
  return apiSuccess(tag, undefined, 201);
}
