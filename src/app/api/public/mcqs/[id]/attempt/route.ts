import { auth } from '@/lib/auth';
import { apiSuccess } from '@/lib/utils';
import { mcqRepository } from '@/server/repositories/mcq.repository';
import { getMongoDb } from '@/lib/mongodb';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const AttemptSchema = z.object({
  selectedOptionIds: z.array(z.string()).min(1),
  timeTakenSeconds: z.number().int().min(0).default(0),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mcqId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = AttemptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 422 });
  }

  const { selectedOptionIds, timeTakenSeconds } = parsed.data;

  const mcq = await mcqRepository.findById(mcqId);
  if (!mcq) {
    return Response.json({ error: 'MCQ not found' }, { status: 404 });
  }

  const correctOptionIds = mcq.options.filter((o) => o.isCorrect).map((o) => o.id);
  const isCorrect =
    correctOptionIds.length === selectedOptionIds.length &&
    correctOptionIds.every((id) => selectedOptionIds.includes(id));

  const session = await auth();
  if (session?.user?.id) {
    const db = await getMongoDb();
    const now = new Date().toISOString();
    await db.collection('practiceAttempts').insertOne({
      id: randomUUID(),
      userId: session.user.id,
      mcqId,
      subjectId: mcq.subjectId ?? '',
      topicId: mcq.topicId ?? '',
      examIds: mcq.examIds ?? [],
      selectedOptionIds,
      correctOptionIds,
      isCorrect,
      timeTakenSeconds,
      createdAt: now,
    });

    await mcqRepository.recordAttempt(mcqId, isCorrect, timeTakenSeconds);
  }

  return apiSuccess({ isCorrect, correctOptionIds });
}
