import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { subjectRepository } from '@/server/repositories/subject.repository';

export async function GET(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const examIdsParam = searchParams.get('examIds');
  if (!examIdsParam) {
    return Response.json({ error: 'examIds query param required' }, { status: 400 });
  }

  const examIds = examIdsParam.split(',').filter(Boolean);
  if (examIds.length === 0) {
    return Response.json({ error: 'examIds must not be empty' }, { status: 400 });
  }

  const sections = await examRepository.getSectionsByExamIds(examIds);
  const subjectIds = [...new Set(sections.map((s) => s.subjectId))];
  const subjects = await subjectRepository.getSubjectsByIds(subjectIds);
  const sorted = subjects.sort((a, b) => a.name.localeCompare(b.name));

  return apiSuccess(sorted, { examIds, total: sorted.length });
}
