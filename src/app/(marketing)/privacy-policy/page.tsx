import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
      <div className="prose prose-zinc mt-6 max-w-none dark:prose-invert">
        <p>
          We collect the minimum data needed to run your account: your name, email, and profile image from Google
          sign-in, plus your activity within the app (progress, attempts, saved content).
        </p>
        <p>
          We never sell your data. Content you mark private stays private to you; content restricted to an audience
          (a class, cohort, or organization) is only ever visible to members of that audience.
        </p>
      </div>
    </main>
  );
}
