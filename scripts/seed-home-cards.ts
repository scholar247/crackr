/**
 * Seeds the default homepage "learning loop" cards. Only inserts when the section is empty, so re-running never overwrites admin edits.
 * Cards are managed afterwards at /admin/page-cards.
 *
 * Run: npm run db:seed-home-cards
 */
import { pageCardRepository } from '@/server/repositories/page-card.repository';

type CardSeed = Omit<Parameters<typeof pageCardRepository.create>[0], 'page' | 'section' | 'isActive' | 'ctaType'>;

const SETS: { page: string; section: string; cards: CardSeed[] }[] = [
  {
    page: 'home',
    section: 'learning-loop',
    cards: [
      {
        sequence: 1,
        title: 'Learn with precision',
        badge: 'Concept foundation',
        description: "Structured theory, revision notes and formula sheets organised chapter by chapter, mapped to each exam's syllabus.",
        listItems: ['Chapter-wise concept explainers', 'Formula and revision cheat-sheets', 'Syllabus-mapped, exam by exam'],
        ctaLabel: 'Browse concept blogs',
        ctaLink: '/blogs',
        accent: 'PRIMARY',
      },
      {
        sequence: 2,
        title: 'Daily practice',
        badge: 'Adaptive drills',
        description: 'Topic-wise MCQs and previous-year questions with instant, step-by-step explanations.',
        listItems: ['Topic-wise MCQ practice', 'Previous-year question sets', 'Instant explanations on every answer'],
        ctaLabel: 'Start practising',
        ctaLink: '/practice',
        accent: 'SECONDARY',
      },
      {
        sequence: 3,
        title: 'Benchmark with mocks',
        badge: 'Exam readiness',
        description: 'Full-length mock tests hosted by us or verified tutors, with a ranked report after every attempt.',
        listItems: ['Timed, exam-style mock tests', 'Section-wise score breakdown', 'Rank among everyone who attempted'],
        ctaLabel: 'Explore mock tests',
        ctaLink: '/exams',
        accent: 'TERTIARY',
      },
    ],
  },
];

async function main() {
  const existing = await pageCardRepository.listAll();

  for (const set of SETS) {
    if (existing.some((c) => c.page === set.page && c.section === set.section)) {
      console.log(`${set.page}/${set.section} already has cards — skipping.`);
      continue;
    }
    for (const card of set.cards) {
      await pageCardRepository.create({ ...card, page: set.page, section: set.section, ctaType: 'TEXT', isActive: true });
    }
    console.log(`Seeded ${set.cards.length} cards for ${set.page}/${set.section}.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
