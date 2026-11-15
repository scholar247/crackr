/**
 * Starter notifications for the CBSE Class 10 / 12 notification boards.
 *
 * Run: npm run seed:cbse-notifications
 *
 * Deliberately limited to things that are verifiably true: what's available on the site
 * (sample papers, mind maps, daily questions) and CBSE policy the site already states,
 * linked to the official source. No invented "date sheet released"-style notices — real
 * CBSE announcements should be added from the admin panel as CBSE publishes them.
 *
 * Idempotent: notifications are keyed by slug; existing ones are left untouched.
 */
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { examNotifications } from '@/server/db/schema';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { notificationRepository } from '@/server/repositories/notification.repository';
import { DEFAULT_CONTENT_AUTHOR_ID } from '@/server/auth/require-auth';
import type { NotificationInput } from '@/schemas/notification.schema';
import { runSeed } from '../lib/upsert';

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

type Seed = Omit<NotificationInput, 'examIds' | 'status'> & { slug: string; exams: ('10' | '12')[] };

const NOTIFICATIONS: Seed[] = [
  {
    slug: 'cbse-class-10-two-board-exams-from-2026',
    exams: ['10'],
    title: 'Two board exams for CBSE Class 10 from 2026',
    summary: 'The February main exam is compulsory; an optional second exam in May lets students improve their score in up to three subjects.',
    content: [
      'From 2026, CBSE holds **two board examinations for Class 10**.',
      '',
      '- **Main exam (Phase 1), February** — compulsory for all students.',
      '- **Second exam, May** — optional. Students can use it to improve their performance in up to three subjects: Science, Mathematics, Social Science and languages.',
      '',
      'Plan your preparation for the February exam as the main target. Read the official CBSE circular for eligibility rules and the exact schedule.',
    ].join('\n'),
    category: 'CIRCULAR',
    isImportant: true,
    sourceUrl: 'https://www.cbse.gov.in',
    publishedAt: daysAgo(6),
  },
  {
    slug: 'cbse-board-exam-2027-date-sheet-awaited',
    exams: ['10', '12'],
    title: 'CBSE board exam 2027 date sheet: not released yet',
    summary: 'The official date sheet for the 2027 board exams has not been published. In recent years, board exams have started in mid-February.',
    content: [
      'CBSE has **not yet released** the date sheet for the 2027 board examinations.',
      '',
      'In recent years the board exams have begun in **mid-February**, so plan to finish the syllabus and start full-length practice papers before then.',
      '',
      'This notice will be updated as soon as the official date sheet is out. Always confirm exam dates on the CBSE website.',
    ].join('\n'),
    category: 'EXAM_DATES',
    isImportant: false,
    sourceUrl: 'https://www.cbse.gov.in',
    publishedAt: daysAgo(4),
  },
  {
    slug: 'cbse-class-10-sample-papers-on-syllabuzai',
    exams: ['10'],
    title: 'CBSE Class 10 sample papers for 2025-26 and 2026-27 now available',
    summary: 'Read the official Class 10 sample question papers with their marking schemes online, subject by subject.',
    content: [
      'The official CBSE Class 10 **sample question papers and marking schemes** for the **2025-26** and **2026-27** sessions are available to read on syllabuzAI.',
      '',
      'Solve each paper in one 3-hour sitting, then mark it with the marking scheme to see exactly where marks are awarded.',
      '',
      '[Open Class 10 sample papers](/exams/cbse-class-10-board/sample-papers)',
    ].join('\n'),
    category: 'SAMPLE_PAPER',
    isImportant: false,
    sourceUrl: null,
    publishedAt: daysAgo(3),
  },
  {
    slug: 'cbse-class-12-sample-papers-on-syllabuzai',
    exams: ['12'],
    title: 'CBSE Class 12 sample papers for 2025-26 and 2026-27 now available',
    summary: 'Official sample question papers for 8 Class 12 subjects in each session, with marking schemes, to read online.',
    content: [
      'The official CBSE Class 12 **sample question papers and marking schemes** for **8 subjects** in each of the **2025-26** and **2026-27** sessions are available on syllabuzAI.',
      '',
      'Use them as full-length mocks in the pre-board months and compare your answers with the marking scheme.',
      '',
      '[Open Class 12 sample papers](/exams/cbse-class-12-board/sample-papers)',
    ].join('\n'),
    category: 'SAMPLE_PAPER',
    isImportant: false,
    sourceUrl: null,
    publishedAt: daysAgo(3),
  },
  {
    slug: 'cbse-class-10-interactive-mind-maps',
    exams: ['10'],
    title: 'New: interactive mind maps for Class 10 Science and Maths',
    summary: 'See how each chapter fits together — expand topics and subtopics, then jump straight to practice and notes.',
    content: [
      'Chapter-wise **interactive mind maps** are now available for Class 10, starting with Science and Mathematics chapters.',
      '',
      'Each map follows the NCERT chapter structure. Expand a topic to see its subtopics, search the map, tick topics off in the revision checklist, and print it for quick revision.',
      '',
      '[Browse Class 10 mind maps](/exams/cbse-class-10-board/mind-maps)',
    ].join('\n'),
    category: 'GENERAL',
    isImportant: false,
    sourceUrl: null,
    publishedAt: daysAgo(1),
  },
  {
    slug: 'cbse-class-12-daily-question-streaks',
    exams: ['12'],
    title: 'Build a daily habit: question of the day with streaks',
    summary: 'Answer one Class 12 question every day, track your streak on a calendar, and see your accuracy over time.',
    content: [
      'Every day there is a new **Class 12 question of the day**. Sign in and your answers are saved to a streak calendar that shows the days you practised, your current and best streak, and your accuracy.',
      '',
      '[Answer today’s question](/exams/cbse-class-12-board/practice)',
    ].join('\n'),
    category: 'GENERAL',
    isImportant: false,
    sourceUrl: null,
    publishedAt: daysAgo(0),
  },
];

runSeed(async () => {
  const [c10, c12] = await Promise.all([taxonomyRepository.findExamBySlug('cbse-class-10-board'), taxonomyRepository.findExamBySlug('cbse-class-12-board')]);
  if (!c10 || !c12) throw new Error('CBSE Class 10/12 exams not found — run the exam seeds first');
  const examId = { '10': c10.id, '12': c12.id };

  for (const { slug, exams, ...n } of NOTIFICATIONS) {
    const [existing] = await db.select({ id: examNotifications.id }).from(examNotifications).where(eq(examNotifications.slug, slug)).limit(1);
    if (existing) {
      console.log(`  – ${slug}: already exists, left unchanged`);
      continue;
    }
    await notificationRepository.create({ ...n, slug, status: 'PUBLISHED', examIds: exams.map((e) => examId[e]) }, DEFAULT_CONTENT_AUTHOR_ID);
    console.log(`  + ${slug}`);
  }
});
