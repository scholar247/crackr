import type { ComponentType } from 'react';
import type { Metadata } from 'next';

/**
 * Contract every custom exam landing module (nimcet.tsx, cuet.tsx, ...) must
 * satisfy. registry.tsx calls `mod.generateMetadata()` on every loader, so a
 * landing file that forgets to export it fails typecheck at the registry
 * instead of silently shipping a page with no SEO tags.
 */
export interface ExamLandingModule {
  default: ComponentType;
  generateMetadata: () => Promise<Metadata>;
}

export interface ExamLandingRegistryEntry {
  /** Code-split via next/dynamic — unregistered exams never load this bundle. */
  Component: ComponentType;
  /** Re-resolves the same module (cached, not a second fetch) to reach its metadata. */
  loadMetadata: () => Promise<Metadata>;
}

export type ExamLandingRegistry = Record<string, ExamLandingRegistryEntry>;
