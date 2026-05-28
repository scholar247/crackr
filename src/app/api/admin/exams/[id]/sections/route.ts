import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { examRepository } from '@/server/repositories/exam.repository';
import { CreateExamSectionSchema } from '@/schemas';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id: examId } = await params;
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subjectId') ?? undefined;

  const sections = await examRepository.getSectionsByExam(examId, subjectId);
  return apiSuccess(sections);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const { id: examId } = await params;
  const body = await req.json();
  const parsed = CreateExamSectionSchema.safeParse({ ...body, examId });
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const section = await examRepository.createSection(parsed.data);
  return apiSuccess(section, undefined, 201);
}
