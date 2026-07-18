import dynamic from 'next/dynamic';
import type { ExamLandingRegistry } from './types';

/**
 * THE ONE PLACE to register a custom exam landing page.
 *
 * `ExamLandingGate` looks slugs up here; anything absent falls back to the
 * generic `<ExamPracticePage />` automatically — no switch statement, no
 * change needed anywhere else when an exam has no custom page.
 *
 * To add a new one:
 *   1. Create `src/components/exams/landing/<slug>.tsx` exporting a default
 *      component and an async `generateMetadata()` (see nimcet.tsx for the shape).
 *   2. Add one entry below, keyed by the exact route slug (`/exams/<slug>`).
 *
 * Each entry imports its module twice on purpose:
 *   - `dynamic(() => import('./slug'))` — next/dynamic requires the `import()`
 *     written inline like this to code-split the component into its own chunk,
 *     so exams *without* a custom landing page never load one that belongs to
 *     another exam.
 *   - `loadMetadata` — a plain `import()` used only to reach `generateMetadata`.
 *     Next.js only honors `generateMetadata` exported from the route's page.tsx,
 *     so page.tsx calls this to delegate. It resolves the same module from the
 *     bundler's module cache, not a second network request.
 */
export const examLandingRegistry: ExamLandingRegistry = {
  nimcet: {
    Component: dynamic(() => import('./nimcet')),
    loadMetadata: () => import('./nimcet').then((mod) => mod.generateMetadata()),
  },
  'gate-cse': {
    Component: dynamic(() => import('./gate-cse')),
    loadMetadata: () => import('./gate-cse').then((mod) => mod.generateMetadata()),
  },
  cuet: {
    Component: dynamic(() => import('./cuet')),
    loadMetadata: () => import('./cuet').then((mod) => mod.generateMetadata()),
  },
};

export function getExamLandingEntry(slug: string) {
  return examLandingRegistry[slug];
}
