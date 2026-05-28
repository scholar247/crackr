import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { userRepository } from '@/server/repositories/user.repository';
import { examRepository } from '@/server/repositories/exam.repository';
import { UpdateProfileSchema } from '@/schemas/profile.schema';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await userRepository.findById(session!.user.id);
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  return apiSuccess(user.profile ?? null);
}

export async function PATCH(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Validate all targetExamIds actually exist
  const exams = await examRepository.getExamsByIds(parsed.data.targetExamIds);
  if (exams.length !== parsed.data.targetExamIds.length) {
    return Response.json({ error: 'One or more invalid exam IDs' }, { status: 400 });
  }

  const updated = await userRepository.updateProfile(session!.user.id, parsed.data);
  if (!updated) return Response.json({ error: 'User not found' }, { status: 404 });

  return apiSuccess(updated.profile);
}
