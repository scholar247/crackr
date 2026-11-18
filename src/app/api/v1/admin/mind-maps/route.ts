import { requireAuth, DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import { mindMapRepository } from '@/server/repositories/mind-map.repository';
import { createMindMap, listEligibleExams } from '@/server/services/mind-maps';
import { AdminMindMapQuerySchema, CreateMindMapSchema } from '@/schemas/mind-map.schema';
import { apiError, apiSuccess } from '@/lib/utils';

// GET /api/v1/admin/mind-maps?examId=&status= — maps + eligible exams with their syllabus
// (and which chapters already have a map) for the create picker.
export async function GET(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const params = Object.fromEntries([...new URL(req.url).searchParams].filter(([, v]) => v !== ''));
  const parsed = AdminMindMapQuerySchema.safeParse(params);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid query', 400);

  const [rows, exams] = await Promise.all([mindMapRepository.listAdmin(parsed.data), listEligibleExams()]);
  const existing = await mindMapRepository.listChapterIds(exams.map((e) => e.id));
  return apiSuccess(rows, { exams, existing });
}

// POST /api/v1/admin/mind-maps { examId, chapterNodeId } — creates a draft generated from
// the chapter's existing topics/subtopics.
export async function POST(req: Request) {
  const { session, error, isServiceKey } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = CreateMindMapSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const result = await createMindMap(parsed.data.examId, parsed.data.chapterNodeId, isServiceKey ? DEFAULT_CONTENT_AUTHOR_ID : session!.user.id);
  if (!result.ok) return apiError(result.error, result.status);
  return apiSuccess({ id: result.id }, undefined, 201);
}
