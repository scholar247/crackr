import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { examSpotlightRepository } from '@/server/repositories/exam-spotlight.repository';
import { articleRepository } from '@/server/repositories/article.repository';
import { apiError, apiSuccess } from '@/lib/utils';

const CreateExamSchema = z.object({
  programId: z.uuid(),
  name: z.string().min(2).max(160),
  description: z.string().max(500).optional(),
  thumbnailUrl: z.url().max(2048).optional(),
});

const BulkStatusSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
  status: z.enum(['ACTIVE', 'ARCHIVED']),
});

// Every exam (inactive ones included) with its published content counts, so admins can
// see which exams are empty before deactivating them.
export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const [rows, summaries, articleCounts] = await Promise.all([
    taxonomyRepository.listExams(),
    examSpotlightRepository.getAllExamSummaries(),
    articleRepository.countPublishedByExam(),
  ]);
  return apiSuccess(
    rows.map(({ exam, programName }) => {
      const s = summaries[exam.id];
      return {
        ...exam,
        programName,
        content: {
          chapters: s?.chapters ?? 0,
          questions: s?.mcqs ?? 0,
          mocks: s?.mockTests ?? 0,
          articles: articleCounts.get(exam.id) ?? 0,
        },
      };
    }),
  );
}

// Bulk activate/deactivate — PATCH { ids, status }.
export async function PATCH(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = BulkStatusSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const updated = await taxonomyRepository.setExamsStatus(parsed.data.ids, parsed.data.status);
  return apiSuccess({ updated });
}

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const parsed = CreateExamSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const exam = await taxonomyRepository.createExam(parsed.data);
  return apiSuccess(exam, undefined, 201);
}
