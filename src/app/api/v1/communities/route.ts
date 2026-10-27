import { requireAuth, optionalAuth } from '@/server/auth/require-auth';
import { communityRepository, COMMUNITY_ERROR_STATUS } from '@/server/repositories/community.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { isAdmin } from '@/lib/roles';
import { CreateCommunitySchema } from '@/schemas/community.schema';
import { apiError, apiSuccess } from '@/lib/utils';

const COMMUNITY_KINDS = ['OFFICIAL', 'USER_CREATED'];

// Discovery feed: every PUBLIC community, plus any PRIVATE one the caller already belongs
// to. Admins can pass ?scope=all to see every PRIVATE community too (same escape hatch as
// GET /api/v1/assessments). Read-only — answers PUBLIC data to anonymous callers.
export async function GET(req: Request) {
  const { userId, role } = await optionalAuth();

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId') ?? undefined;
  const programId = searchParams.get('programId') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const kindParam = searchParams.get('kind');
  const kind = COMMUNITY_KINDS.includes(kindParam ?? '') ? (kindParam as 'OFFICIAL' | 'USER_CREATED') : undefined;
  const scopeAll = searchParams.get('scope') === 'all' && !!role && isAdmin(role);

  const rows = await communityRepository.findVisibleToUser(userId, role, { examId, programId, search, kind, scopeAll });
  return apiSuccess(rows);
}

// Any signed-in user can create a USER_CREATED community. OFFICIAL (the canonical
// per-exam/program hub) requires ADMIN+ — kind is decided here from the caller's role,
// never trusted from the request body.
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const parsed = CreateCommunitySchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  const input = parsed.data;

  const wantsOfficial = Boolean(input.examId || input.programId);
  if (wantsOfficial && !isAdmin(session!.user.role)) {
    return apiError('Only an admin can create an official exam/program community', 403);
  }

  if (input.examId) {
    const exam = await taxonomyRepository.findExamById(input.examId);
    if (!exam || exam.status !== 'ACTIVE') return apiError('Invalid exam', 400);
  }
  if (input.programId) {
    const program = await taxonomyRepository.findProgramById(input.programId);
    if (!program || program.status !== 'ACTIVE') return apiError('Invalid program', 400);
  }

  try {
    const community = await communityRepository.createCommunity({
      ...input,
      kind: wantsOfficial ? 'OFFICIAL' : 'USER_CREATED',
      creatorUserId: session!.user.id,
    });
    return apiSuccess(community, undefined, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create community';
    return apiError(message, COMMUNITY_ERROR_STATUS[message] ?? 400);
  }
}
