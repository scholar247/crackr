import { requireAuth } from '@/lib/api-helpers';
import { apiSuccess } from '@/lib/utils';
import { subjectRepository } from '@/server/repositories/subject.repository';
import { CreateSubjectSchema } from '@/schemas';

export async function GET() {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const subjects = await subjectRepository.findAll(false);
  return apiSuccess(subjects);
}

export async function POST(req: Request) {
  const { error } = await requireAuth('ADMIN');
  if (error) return error;

  const body = await req.json();
  const parsed = CreateSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const subject = await subjectRepository.create(parsed.data);
  return apiSuccess(subject, undefined, 201);
}
