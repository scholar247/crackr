import { auth } from '@/lib/auth';
import { apiSuccess } from '@/lib/utils';
import { interviewService } from '@/server/services/interview.service';
import { CreateDiagramSchema } from '@/schemas/interview.schema';

// Session is optional here on purpose — see the TODO(auth) notes in
// interview.service.ts. An anonymous creator just gets a PUBLIC diagram.
export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();
  const parsed = CreateDiagramSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const diagram = await interviewService.create(parsed.data, session?.user?.id ?? null);
  return apiSuccess(diagram, undefined, 201);
}
