import { requireAuth } from '@/server/auth/require-auth';
import { userRepository } from '@/server/repositories/user.repository';
import { apiSuccess } from '@/lib/utils';

// Deliberately tiny and separate from the PATCH-only /api/v1/me/profile route — this is
// the one piece of profile data (primary exam name) that isn't in the JWT session, and is
// fetched client-side by the announcement bar so the marketing layout's other pages
// (about/contact/privacy/terms) can stay statically prerendered rather than forcing every
// page under it dynamic just to check auth() server-side.
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const targets = await userRepository.findExamTargetsByUserId(session!.user.id);
  const primary = targets.find((t) => t.isPrimary) ?? null;
  return apiSuccess(primary ? { examName: primary.examName } : null);
}
