/**
 * Seeds the database with sample mocks and mock submissions for the user
 * shivam.anuj.pradhan@gmail.com to test the progress tracking feature.
 *
 * Usage:
 *   DATABASE_URL=mysql://root@127.0.0.1:3306/scholar247 npx tsx scripts/seed-progress-mocks.ts
 */

import { randomUUID } from 'crypto';
import { db } from '@/server/db/client';
import { users, exams, curriculumNodes, examNodeMap, assessments, assessmentSections, assessmentQuestions, assessmentAttempts, attemptResponses } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

const TEST_EMAIL = 'shivam.anuj.pradhan@gmail.com';

async function main() {
  console.log('🌱 Seeding progress mocks...\n');

  // Find or create the test user
  const user = await db.query.users.findFirst({
    where: eq(users.email, TEST_EMAIL),
  });

  if (!user) {
    console.error(`❌ User ${TEST_EMAIL} not found. Please create this user first.`);
    process.exit(1);
  }

  console.log(`✓ Found user: ${user.name} (${user.id})`);

  // Get NIMCET exam
  const nimcetExam = await db.query.exams.findFirst({
    where: eq(exams.slug, 'nimcet'),
  });

  if (!nimcetExam) {
    console.error('❌ NIMCET exam not found. Please create it first.');
    process.exit(1);
  }

  console.log(`✓ Found exam: ${nimcetExam.name}`);

  // Get some nodes (subjects/chapters) — curriculumNodes has no examId column; the
  // exam <-> node relationship lives in the exam_node_map join table.
  const examNodeRows = await db
    .select({ node: curriculumNodes })
    .from(examNodeMap)
    .innerJoin(curriculumNodes, eq(curriculumNodes.id, examNodeMap.nodeId))
    .where(eq(examNodeMap.examId, nimcetExam.id))
    .limit(5);
  const nodes = examNodeRows.map((r) => r.node);

  if (nodes.length === 0) {
    console.error('❌ No curriculum nodes found. Please create curriculum structure first.');
    process.exit(1);
  }

  console.log(`✓ Found ${nodes.length} curriculum nodes\n`);

  // Get some questions for the exam
  const allQuestions = await db.query.questions.findMany({
    limit: 200,
  });

  if (allQuestions.length === 0) {
    console.error('❌ No questions found in the database.');
    process.exit(1);
  }

  console.log(`✓ Found ${allQuestions.length} questions\n`);

  // Create 4 sample mocks
  const mockConfigs = [
    { title: 'NIMCET Practice Mock 1', description: 'First practice mock for NIMCET', durationMinutes: 180 },
    { title: 'NIMCET Practice Mock 2', description: 'Second practice mock for NIMCET', durationMinutes: 120 },
    { title: 'NIMCET Full Mock', description: 'Full-length NIMCET mock test', durationMinutes: 200 },
    { title: 'NIMCET Final Revision Mock', description: 'Final revision mock before exam', durationMinutes: 180 },
  ];

  for (const mockConfig of mockConfigs) {
    console.log(`📝 Creating mock: ${mockConfig.title}`);

    // Create the assessment (mock)
    const assessmentId = randomUUID();
    await db.insert(assessments).values({
      id: assessmentId,
      type: 'MOCK',
      title: mockConfig.title,
      description: mockConfig.description,
      creatorUserId: user.id,
      examId: nimcetExam.id,
      visibility: 'PRIVATE',
      status: 'PUBLISHED',
      durationSeconds: mockConfig.durationMinutes * 60,
    });

    console.log(`  ✓ Assessment created: ${assessmentId}`);

    // Create sections (one per node)
    const sectionIds: string[] = [];
    for (let i = 0; i < Math.min(nodes.length, 3); i++) {
      const sectionId = randomUUID();
      await db.insert(assessmentSections).values({
        id: sectionId,
        assessmentId,
        title: nodes[i].name,
        nodeId: nodes[i].id,
        position: i,
        questionCount: 10,
        difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3] as 'EASY' | 'MEDIUM' | 'HARD',
        // decimal columns are typed as strings by drizzle, not numbers.
        defaultMarks: '1',
        defaultNegativeMarks: '0.25',
      });
      sectionIds.push(sectionId);
      console.log(`    ✓ Section created: ${nodes[i].name}`);
    }

    // Add questions to assessment
    let position = 0;
    for (let sectionIdx = 0; sectionIdx < sectionIds.length; sectionIdx++) {
      for (let q = 0; q < 10; q++) {
        const question = allQuestions[(Math.random() * allQuestions.length) | 0];
        if (!question) continue;

        await db.insert(assessmentQuestions).values({
          assessmentId,
          questionId: question.id,
          sectionId: sectionIds[sectionIdx],
          position,
          marks: '1',
          negativeMarks: '0.25',
          questionSnapshot: {
            stem: question.stem,
            options: question.optionsJson,
            explanation: question.explanation,
            difficulty: question.difficulty,
          },
        });
        position++;
      }
    }

    console.log(`  ✓ Added ${position} questions to assessment\n`);

    // Create 2-3 attempts for this mock with varying scores
    const attemptCounts = [2, 3, 2, 2];
    for (let attemptNum = 0; attemptNum < attemptCounts[mockConfigs.indexOf(mockConfig)]; attemptNum++) {
      const attemptId = randomUUID();
      const score = Math.random() * 30 + 10; // 10-40 marks
      const percentage = (score / 40) * 100; // Assuming 40 total marks
      const timeSpent = Math.random() * 7200 + 3600; // 1-3 hours

      await db.insert(assessmentAttempts).values({
        id: attemptId,
        assessmentId,
        userId: user.id,
        attemptNumber: attemptNum + 1,
        status: 'SUBMITTED',
        countsTowardProgress: true,
        score: score.toString(),
        percentage: percentage.toFixed(2),
        timeSpentSeconds: Math.floor(timeSpent),
        submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      });

      console.log(`  ✓ Attempt ${attemptNum + 1} created: Score ${score.toFixed(1)}/40 (${percentage.toFixed(1)}%)`);

      // Add sample responses
      for (let r = 0; r < position; r++) {
        const isCorrect = Math.random() > 0.5;
        await db.insert(attemptResponses).values({
          id: randomUUID(),
          attemptId,
          questionId: allQuestions[r % allQuestions.length].id,
          selectedOptionKeys: isCorrect ? ['A'] : ['B'],
          isCorrect,
          marksAwarded: isCorrect ? '1' : '0',
          timeSpentSeconds: Math.floor(Math.random() * 180),
        });
      }
    }
  }

  console.log('✅ Seed completed successfully!\n');
  console.log('📊 Sample data created:');
  console.log(`   • 4 mock tests for user ${TEST_EMAIL}`);
  console.log('   • 9 total attempts across mocks');
  console.log('   • Varying scores and performance metrics');
  console.log('   • Multiple exams for comparative analysis');
  console.log('\n🚀 Visit /progress to see the progress tracking dashboard!');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
