import { requireAuth } from '@/server/auth/require-auth';
import { userRepository } from '@/server/repositories/user.repository';
import { apiSuccess } from '@/lib/utils';

export async function POST() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await userRepository.completeOnboarding(session!.user.id);
  return apiSuccess({ onboardingCompleted: true });
}
