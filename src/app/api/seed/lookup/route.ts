import { requireApiKey } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { examRepository } from '@/server/repositories/exam.repository';
import { topicRepository } from '@/server/repositories/topic.repository';
import { pypRepository } from '@/server/repositories/pyp.repository';

/**
 * GET /api/seed/lookup?type=subjects|exams|topics|pyps[&subjectId=...][&examId=...]
 *
 * Returns id + name (+ slug) for the requested entity type so
 * scripts can resolve names to IDs without hardcoding them.
 */
export async function GET(req: Request) {
  const err = requireApiKey(req);
  if (err) return err;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'subjects': {
        const subjects = await subjectRepository.findAll(false);
        return apiSuccess(subjects.map((s) => ({ id: s.id, name: s.name, slug: s.slug })));
      }

      case 'exams': {
        const exams = await examRepository.findAll(false);
        return apiSuccess(
          exams.map((e) => ({ id: e.id, name: e.name, slug: e.slug, category: e.category, subjectIds: e.subjectIds }))
        );
      }

      case 'topics': {
        const subjectId = searchParams.get('subjectId');
        if (!subjectId) return apiError('subjectId is required for type=topics', 400);
        const topics = await topicRepository.findAllBySubject(subjectId, false);
        return apiSuccess(
          topics.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            depth: t.depth,
            parentId: t.parentId,
            pathNames: t.pathNames,
          }))
        );
      }

      case 'pyps': {
        const examId = searchParams.get('examId');
        const pyps = examId
          ? await pypRepository.findByExam(examId, false)
          : await pypRepository.findAll(false);
        return apiSuccess(pyps.map((p) => ({ id: p.id, title: p.title, slug: p.slug, examId: p.examId, year: p.year, month: p.month, mcqCount: p.mcqCount })));
      }

      default:
        return apiError('type must be one of: subjects, exams, topics, pyps', 400);
    }
  } catch (e) {
    console.error('[seed/lookup]', e);
    return apiError('Lookup failed', 500);
  }
}
