import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { groupRepository } from '@/server/repositories/group.repository';
import { CreateGroupSchema } from '@/schemas';

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const groups = await groupRepository.findAll();
  return apiSuccess(groups);
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth('ADMIN');
  if (error) return error;

  const body = await req.json();
  const parsed = CreateGroupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const group = await groupRepository.create(parsed.data, session!.user.id);
  return apiSuccess(group, undefined, 201);
}
