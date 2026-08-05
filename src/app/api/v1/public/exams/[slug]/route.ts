import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { apiError, apiSuccess } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = await taxonomyRepository.findExamBySlug(slug);
  if (!exam || exam.status !== 'ACTIVE') return apiError('Not found', 404);

  const syllabus = await taxonomyRepository.getSyllabusTree(exam.id);
  return apiSuccess({ exam, syllabus });
}
