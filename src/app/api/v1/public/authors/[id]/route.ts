import { userRepository } from '@/server/repositories/user.repository';
import { apiError, apiSuccess } from '@/lib/utils';

// No auth — but deliberately not just `apiSuccess(user)`: this is the one place a
// signed-in user's basic identity is exposed to anyone browsing the blog, so the
// response is hand-picked to exclude email/role/status and every other account field.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await userRepository.findById(id);
  if (!user) return apiError('Not found', 404);

  return apiSuccess({
    id: user.id,
    name: user.name,
    image: user.image,
    college: user.college,
    degree: user.degree,
  });
}
