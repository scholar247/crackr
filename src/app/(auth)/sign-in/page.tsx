import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Scholar247 with your Google account',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // Already authenticated — redirect to appropriate dashboard
  if (session?.user) {
    const role = session.user.role;
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(role);
    redirect(params.callbackUrl ?? (isAdmin ? '/admin/dashboard' : '/dashboard'));
  }

  return <SignInForm error={params.error} callbackUrl={params.callbackUrl} />;
}
