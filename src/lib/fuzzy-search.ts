// Lightweight fuzzy matcher for short in-memory lists (a page's worth of exam/program
// names) — not a search-index library, just cheap enough to re-run on every keystroke.
// Ranks exact substring matches highest (word-start matches bonus), then falls back to an
// in-order character-subsequence match ("scm" matching "Set theory & Combinatorics MCQs")
// so a few missed/transposed letters still surface a result. Returns null when `query`'s
// characters don't all appear in order in `target` at all.

export function fuzzyScore(query: string, target: string): number | null {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();
  if (!q) return null;

  const exactIndex = t.indexOf(q);
  if (exactIndex !== -1) {
    const isWordStart = exactIndex === 0 || /\s/.test(t[exactIndex - 1]);
    return 1000 - exactIndex + (isWordStart ? 50 : 0);
  }

  // In-order subsequence match: every character of the query must appear in target in
  // the same order, though not necessarily contiguously. Score rewards a tighter span
  // (fewer/smaller gaps between matched characters) and an earlier starting position.
  let ti = 0;
  let qi = 0;
  let firstMatch = -1;
  let lastMatch = -1;
  let gapPenalty = 0;
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) {
      if (firstMatch === -1) firstMatch = ti;
      if (lastMatch !== -1) gapPenalty += ti - lastMatch - 1;
      lastMatch = ti;
      qi++;
    }
    ti++;
  }
  if (qi < q.length) return null;

  return 500 - gapPenalty * 5 - firstMatch;
}

export function fuzzyMatch<T>(items: T[], query: string, getText: (item: T) => string, limit = 8): T[] {
  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const score = fuzzyScore(query, getText(item));
    if (score !== null) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}
