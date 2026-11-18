// Shared exam-notification constants and URL helpers — no server imports, so safe for
// client components and the DB schema alike.

export const NOTIFICATION_CATEGORIES = ['EXAM_DATES', 'DATE_SHEET', 'ADMIT_CARD', 'RESULT', 'SYLLABUS', 'SAMPLE_PAPER', 'CIRCULAR', 'GENERAL'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  EXAM_DATES: 'Exam dates',
  DATE_SHEET: 'Date sheet',
  ADMIT_CARD: 'Admit card',
  RESULT: 'Result',
  SYLLABUS: 'Syllabus',
  SAMPLE_PAPER: 'Sample paper',
  CIRCULAR: 'Circular',
  GENERAL: 'General',
};

/** Category from a query param: `date-sheet` / `DATE_SHEET` → 'DATE_SHEET'. */
export function parseCategoryParam(raw: string | undefined | null): NotificationCategory | null {
  if (!raw) return null;
  const value = raw.toUpperCase().replace(/-/g, '_');
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(value) ? (value as NotificationCategory) : null;
}

// Notifications have no pages of their own: they're read in place on the exam home page's
// notification board. Each one has an anchor there, which opens and scrolls to it.

/** Element id of a notice on the exam home page's board. */
export function noticeAnchor(slug: string): string {
  return `notice-${slug}`;
}

/** Link to one notice (opened on the exam home page), or to the board when no slug. */
export function noticeHref(examSlug: string, slug?: string): string {
  return `/exams/${examSlug}#${slug ? noticeAnchor(slug) : 'notifications'}`;
}

/** Notices shown in the home-page board (newest first); older ones drop off. */
export const BOARD_NOTIFICATION_LIMIT = 20;

/** "New" badge window. */
export const NEW_NOTICE_DAYS = 7;

/** Public API default page size. */
export const NOTIFICATIONS_PAGE_SIZE = 10;

const IST_DATE = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });

/** "12 Nov 2026", always in IST (the audience's calendar) whatever the server's zone. */
export function formatNotificationDate(date: Date | string): string {
  return IST_DATE.format(new Date(date));
}

const IST_DAY = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' });
const IST_MONTH = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' });

/** { day: '12', month: 'Nov' } in IST, for calendar-style date chips. */
export function noticeDayParts(date: Date | string): { day: string; month: string } {
  const d = new Date(date);
  return { day: IST_DAY.format(d), month: IST_MONTH.format(d) };
}
