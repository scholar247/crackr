// Theme tokens, not hardcoded hexes — a hardcoded chart color would look wrong the moment
// the theme (or dark mode) changes. Five distinct hues already exist in the design system;
// cycle through them for a 6th+ series rather than reaching for a new color.
export const PROGRESS_CHART_COLORS = ['var(--primary)', 'var(--secondary)', 'var(--tertiary)', 'var(--warning)', 'var(--destructive)'];

export function progressColorFor(index: number): string {
  return PROGRESS_CHART_COLORS[index % PROGRESS_CHART_COLORS.length];
}

// A raw score can go negative (negative marking outweighing correct answers on a small
// section) — mathematically accurate, but a "-25% mastery" bar/badge reads as broken UI.
// Keep the real number in the data layer; clamp only where it's rendered visually.
export function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}
