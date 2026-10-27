import { requireAuth } from '@/server/auth/require-auth';
import { assessmentRepository } from '@/server/repositories/assessment.repository';
import { isAdmin } from '@/lib/roles';
import { apiSuccess } from '@/lib/utils';

const ASSESSMENT_TYPES = ['MOCK', 'TEST', 'CHALLENGE', 'OFFICIAL'];

// Lists assessments visible to the caller: created by them, or resolvable via an
// assessmentAccess grant (direct or via audience membership) — see
// assessmentRepository.findVisibleToUser. Admins can pass ?scope=all to see everything.
export async function GET(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get('type');
  const type = ASSESSMENT_TYPES.includes(typeParam ?? '') ? typeParam! : undefined;
  const scopeAll = searchParams.get('scope') === 'all' && isAdmin(session!.user.role);

  const rows = await assessmentRepository.findVisibleToUser(session!.user.id, session!.user.role, { type, scopeAll });
  return apiSuccess(rows);
}
