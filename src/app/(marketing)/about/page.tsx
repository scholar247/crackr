import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">About scholar247</h1>
      <p className="mt-4 text-muted-foreground">
        scholar247 is an exam-preparation platform built around a simple idea: content should be reusable across the
        exams and cohorts that need it, not duplicated for each one. Structured curricula, curated questions, and
        in-depth articles come together so learners always know what to study next.
      </p>
    </main>
  );
}
