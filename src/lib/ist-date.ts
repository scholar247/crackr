// IST calendar-day helpers, shared by server and client. "Day" keys are YYYY-MM-DD strings
// for the Indian calendar day — the same day maths as the question-of-the-day rotation in
// exam-spotlight.repository (istDayNumber), so a streak day and "today's question" always
// roll over together at IST midnight.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD of the IST calendar day containing `at`. */
export function istDayKey(at: Date | number = Date.now()): string {
  const ms = typeof at === 'number' ? at : at.getTime();
  const dayNumber = Math.floor((ms + IST_OFFSET_MS) / DAY_MS);
  return new Date(dayNumber * DAY_MS).toISOString().slice(0, 10);
}

/** Day key `n` days after `key` (negative for earlier). */
export function addDays(key: string, n: number): string {
  const t = Date.parse(`${key}T00:00:00Z`) + n * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

/** YYYY-MM of a day key. */
export function monthOf(key: string): string {
  return key.slice(0, 7);
}

/** Month key `n` months after `month` (YYYY-MM). */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** Calendar layout for a month: leading blanks (Sunday-first) and its day keys. */
export function monthGrid(month: string): { leading: number; days: string[] } {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    leading: first.getUTCDay(),
    days: Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  };
}

const MONTH_LABEL = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const DAY_LABEL = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "November 2026". */
export function monthLabel(month: string): string {
  return MONTH_LABEL.format(new Date(`${month}-01T00:00:00Z`));
}

/** "15 Nov". */
export function dayLabel(key: string): string {
  return DAY_LABEL.format(new Date(`${key}T00:00:00Z`));
}
