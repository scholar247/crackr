import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
      <div className="prose prose-zinc mt-6 max-w-none dark:prose-invert">
        <p>
          By using scholar247 you agree to use the platform for personal exam preparation, not to redistribute
          paid or restricted content, and to keep your account credentials secure.
        </p>
        <p>Content on the platform is provided for educational purposes and may be updated or corrected over time.</p>
      </div>
    </main>
  );
}
