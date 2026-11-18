// SM-2 spaced repetition (the SuperMemo-2 algorithm used by Anki and most flashcard apps).
// Pure: callers pass "today" as a day number, so it is deterministic and testable.

export interface SrsCard {
  /** Successful reviews in a row (0 after a lapse). */
  reps: number;
  /** Days until the next review. */
  interval: number;
  /** Ease factor (≥ 1.3); higher = intervals grow faster. */
  ease: number;
  /** Day number the card is next due. */
  due: number;
  /** Times the card was forgotten after being learned. */
  lapses: number;
  /** Day number of the last review. */
  last: number;
}

/** 1 = forgot (Again), 3 = hard, 4 = good, 5 = easy. */
export type Grade = 1 | 3 | 4 | 5;

export const GRADES: { grade: Grade; label: string; key: string }[] = [
  { grade: 1, label: 'Again', key: '1' },
  { grade: 3, label: 'Hard', key: '2' },
  { grade: 4, label: 'Good', key: '3' },
  { grade: 5, label: 'Easy', key: '4' },
];

/** Local calendar day number (days since 1970-01-01 in the viewer's timezone). */
export function dayNumber(at: Date = new Date()): number {
  return Math.floor((at.getTime() - at.getTimezoneOffset() * 60_000) / 86_400_000);
}

export function review(card: SrsCard | undefined, grade: Grade, today: number): SrsCard {
  const c = card ?? { reps: 0, interval: 0, ease: 2.5, due: today, lapses: 0, last: today };
  let { reps, interval, lapses } = c;
  if (grade < 3) {
    if (c.reps > 0) lapses++;
    reps = 0;
    interval = 1;
  } else {
    reps++;
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(c.interval * c.ease);
    if (grade === 3) interval = Math.max(1, Math.round(interval * 0.8));
    // Easy jumps ahead: 4 days on a first review, otherwise 30% longer than Good.
    if (grade === 5) interval = reps === 1 ? 4 : Math.round(interval * 1.3);
  }
  const q = grade;
  const ease = Math.max(1.3, c.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  return { reps, interval, ease: Math.round(ease * 100) / 100, due: today + interval, lapses, last: today };
}

/** The interval a grade would give, for the button labels ("Good · 6d"). */
export function previewInterval(card: SrsCard | undefined, grade: Grade, today: number): number {
  return review(card, grade, today).interval;
}

export function isDue(card: SrsCard | undefined, today: number): boolean {
  return !card || card.due <= today;
}

/**
 * How well a card is known, 0–1 (null = never reviewed). Recently forgotten cards are weak;
 * long intervals with good ease are strong.
 */
export function masteryScore(card: SrsCard | undefined): number | null {
  if (!card) return null;
  if (card.reps === 0) return 0.15;
  const fromInterval = Math.min(1, Math.log2(1 + card.interval) / Math.log2(1 + 30));
  const fromEase = (card.ease - 1.3) / (3 - 1.3);
  // Remembered at least once since the last lapse → at least "learning"; only forgotten cards are weak.
  return Math.max(0.45, Math.min(1, 0.7 * fromInterval + 0.3 * fromEase - 0.05 * card.lapses));
}

export type MasteryLevel = 'new' | 'weak' | 'learning' | 'strong';

export function masteryLevel(score: number | null): MasteryLevel {
  if (score === null) return 'new';
  if (score < 0.4) return 'weak';
  if (score < 0.75) return 'learning';
  return 'strong';
}
