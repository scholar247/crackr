import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { assertInternalCallbackPath, defaultDashboardPath } from '@/lib/roles';
import { Logo } from '@/components/layout/logo';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user) {
    redirect(assertInternalCallbackPath(callbackUrl) ?? defaultDashboardPath(session.user.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border p-8 text-center">
        <Link href="/" className="mx-auto flex w-fit items-center">
          <Logo width={144} height={30} priority />
        </Link>
        <h1 className="mt-6 text-xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Sign in to continue your exam prep.</p>
        <div className="mt-6">
          <SignInForm callbackUrl={assertInternalCallbackPath(callbackUrl) ?? undefined} />
        </div>
      </div>
    </main>
  );
}
