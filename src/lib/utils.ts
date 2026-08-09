import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Slugify a string */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Format seconds as mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Format a percentage with 1 decimal */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

/** Truncate text to maxLength chars */
export function truncate(str: string, maxLength = 100): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

/** Shuffle array (Fisher-Yates) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a consistent API error response */
export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/** Parses a route param expected to be a positive integer content id (questions,
 * articles); null if it isn't one, e.g. a stray non-numeric value in the URL. */
export function parseContentId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Build a consistent API success response */
export function apiSuccess<T>(data: T, meta?: object, status = 200) {
  return Response.json({ data, meta }, { status });
}

/** Parse comma-separated string to array */
export function parseCSV(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Difficulty colors */
export const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  HARD: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  EXPERT: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
};

/** Role badge colors */
export const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ADMIN: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  TEACHER: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  STUDENT: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

/** Status badge colors */
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  IN_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  ARCHIVED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
};

/** Generate CSV string from array of objects */
export function toCSV<T extends Record<string, unknown>>(rows: T[], headers: (keyof T)[]): string {
  const headerRow = headers.join(',');
  const dataRows = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        // Escape quotes and wrap in quotes if needed
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}
