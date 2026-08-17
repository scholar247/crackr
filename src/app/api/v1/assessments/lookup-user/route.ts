import { requireAuth } from '@/server/auth/require-auth';
import { userRepository } from '@/server/repositories/user.repository';
import { apiError, apiSuccess } from '@/lib/utils';

// Opponent lookup for challenge creation — requires an existing account (no pending-invite
// path for a live 1v1). Deliberately returns only {id, name}, same "hand-picked minimal
// fields" precedent as /api/v1/public/authors/[id] — never email/role/status to another user.
export async function GET(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) return apiError('email is required', 400);

  const user = await userRepository.findByEmail(email);
  if (!user) return apiError('No account found for that email', 404);

  return apiSuccess({ id: user.id, name: user.name });
}
