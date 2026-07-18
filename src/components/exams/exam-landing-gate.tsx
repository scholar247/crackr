import { ExamPracticePage } from './exam-practice-page';
import { getExamLandingEntry } from './landing/registry';

/**
 * The single branch point between "this exam has a bespoke landing page" and
 * "render the generic practice page instead". page.tsx only ever renders
 * this gate — it never needs to know the registry exists.
 *
 * Stays a Server Component (no 'use client') so both branches can render on
 * the server: the custom landing pages are SEO pages that need SSR, and
 * `next/dynamic`'s `ssr: false` isn't available inside Server Components
 * anyway (nor wanted here).
 */
export function ExamLandingGate({ slug }: { slug: string }) {
  const entry = getExamLandingEntry(slug);

  if (entry) {
    const { Component } = entry;
    return <Component />;
  }

  return <ExamPracticePage slug={slug} />;
}
