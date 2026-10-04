/**
 * Seeds the three default homepage "learning loop" cards. Only inserts when the
 * home/learning-loop section is empty, so re-running never overwrites admin edits.
 * Cards are managed afterwards at /admin/page-cards.
 *
 * Run: npm run db:seed-home-cards
 */
import { pageCardRepository } from '@/server/repositories/page-card.repository';

const SECTION = { page: 'home', section: 'learning-loop' } as const;

async function main() {
  const existing = await pageCardRepository.listAll();
  if (existing.some((c) => c.page === SECTION.page && c.section === SECTION.section)) {
    console.log('home/learning-loop already has cards — skipping.');
    return;
  }

  await pageCardRepository.create({
    ...SECTION,
    sequence: 1,
    title: 'Learn with precision',
    badge: 'Concept foundation',
    description: 'Structured theory, revision notes and formula sheets organised chapter by chapter, mapped to each exam\'s syllabus.',
    listItems: ['Chapter-wise concept explainers', 'Formula and revision cheat-sheets', 'Syllabus-mapped, exam by exam'],
    ctaLabel: 'Browse concept blogs',
    ctaLink: '/blogs',
    ctaType: 'TEXT',
    accent: 'PRIMARY',
    isActive: true,
  });
  await pageCardRepository.create({
    ...SECTION,
    sequence: 2,
    title: 'Daily practice',
    badge: 'Adaptive drills',
    description: 'Topic-wise MCQs and previous-year questions with instant, step-by-step explanations.',
    listItems: ['Topic-wise MCQ practice', 'Previous-year question sets', 'Instant explanations on every answer'],
    ctaLabel: 'Start practising',
    ctaLink: '/practice',
    ctaType: 'TEXT',
    accent: 'SECONDARY',
    isActive: true,
  });
  await pageCardRepository.create({
    ...SECTION,
    sequence: 3,
    title: 'Benchmark with mocks',
    badge: 'Exam readiness',
    description: 'Full-length mock tests hosted by us or verified tutors, with a ranked report after every attempt.',
    listItems: ['Timed, exam-style mock tests', 'Section-wise score breakdown', 'Rank among everyone who attempted'],
    ctaLabel: 'Explore mock tests',
    ctaLink: '/exams',
    ctaType: 'TEXT',
    accent: 'TERTIARY',
    isActive: true,
  });

  console.log('Seeded 3 homepage cards.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
