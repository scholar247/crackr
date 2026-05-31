/**
 * One-time MongoDB index setup for all collections.
 * Run: npx tsx --env-file=.env.local scripts/setup-mongo-indexes.ts
 */

import { MongoClient } from 'mongodb';

async function setup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  const dbName = process.env.MONGODB_DB ?? 'scholar247';

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log('Creating indexes...\n');

  // ── subjects ───────────────────────────────────────────────────────────────
  await db.collection('subjects').createIndex({ id: 1 }, { unique: true });
  await db.collection('subjects').createIndex({ slug: 1 }, { unique: true });
  await db.collection('subjects').createIndex({ isActive: 1 });
  console.log('  subjects ✓');

  // ── topics ─────────────────────────────────────────────────────────────────
  await db.collection('topics').createIndex({ id: 1 }, { unique: true });
  await db.collection('topics').createIndex({ subjectId: 1 });
  await db.collection('topics').createIndex({ parentId: 1 });
  await db.collection('topics').createIndex({ path: 1 });
  await db.collection('topics').createIndex({ slug: 1 });
  await db.collection('topics').createIndex({ subjectId: 1, parentId: 1, slug: 1 });
  console.log('  topics ✓');

  // ── tags ───────────────────────────────────────────────────────────────────
  await db.collection('tags').createIndex({ id: 1 }, { unique: true });
  await db.collection('tags').createIndex({ name: 1 });
  console.log('  tags ✓');

  // ── exams ──────────────────────────────────────────────────────────────────
  await db.collection('exams').createIndex({ id: 1 }, { unique: true });
  await db.collection('exams').createIndex({ slug: 1 }, { unique: true });
  await db.collection('exams').createIndex({ category: 1 });
  await db.collection('exams').createIndex({ subjectIds: 1 });
  await db.collection('exams').createIndex({ isActive: 1 });
  console.log('  exams ✓');

  // ── examSections ───────────────────────────────────────────────────────────
  await db.collection('examSections').createIndex({ id: 1 }, { unique: true });
  await db.collection('examSections').createIndex({ examId: 1 });
  await db.collection('examSections').createIndex({ topicId: 1 });
  await db.collection('examSections').createIndex({ examId: 1, subjectId: 1 });
  await db.collection('examSections').createIndex({ examId: 1, topicId: 1 }, { unique: true });
  console.log('  examSections ✓');

  // ── mcqs ───────────────────────────────────────────────────────────────────
  await db.collection('mcqs').createIndex({ id: 1 }, { unique: true });
  await db.collection('mcqs').createIndex({ subjectId: 1 });
  await db.collection('mcqs').createIndex({ topicId: 1 });
  await db.collection('mcqs').createIndex({ topicPath: 1 });
  await db.collection('mcqs').createIndex({ examIds: 1 });
  await db.collection('mcqs').createIndex({ examSectionIds: 1 });
  await db.collection('mcqs').createIndex({ tagIds: 1 });
  await db.collection('mcqs').createIndex({ difficulty: 1 });
  await db.collection('mcqs').createIndex({ isActive: 1 });
  await db.collection('mcqs').createIndex({ isPreviousYear: 1 });
  await db.collection('mcqs').createIndex({ createdAt: -1 });
  await db.collection('mcqs').createIndex({ isActive: 1, subjectId: 1, difficulty: 1 });
  await db.collection('mcqs').createIndex({ isActive: 1, examIds: 1 });
  await db.collection('mcqs').createIndex(
    { 'question.content': 'text' },
    { name: 'mcqs_text_search' }
  );
  console.log('  mcqs ✓');

  // ── users ──────────────────────────────────────────────────────────────────
  await db.collection('users').createIndex({ id: 1 }, { unique: true });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ role: 1 });
  await db.collection('users').createIndex({ createdAt: -1 });
  console.log('  users ✓');

  // ── groups ─────────────────────────────────────────────────────────────────
  await db.collection('groups').createIndex({ id: 1 }, { unique: true });
  console.log('  groups ✓');

  // ── tests ──────────────────────────────────────────────────────────────────
  await db.collection('tests').createIndex({ id: 1 }, { unique: true });
  await db.collection('tests').createIndex({ status: 1 });
  await db.collection('tests').createIndex({ allowedUserIds: 1 });
  await db.collection('tests').createIndex({ allowedGroupIds: 1 });
  await db.collection('tests').createIndex({ createdAt: -1 });
  console.log('  tests ✓');

  // ── testAttempts ───────────────────────────────────────────────────────────
  await db.collection('testAttempts').createIndex({ id: 1 }, { unique: true });
  await db.collection('testAttempts').createIndex({ testId: 1, userId: 1 });
  await db.collection('testAttempts').createIndex({ userId: 1 });
  await db.collection('testAttempts').createIndex({ userId: 1, status: 1, submittedAt: -1 });
  await db.collection('testAttempts').createIndex({ status: 1, submittedAt: -1 });
  console.log('  testAttempts ✓');

  // ── mockSessions ───────────────────────────────────────────────────────────
  await db.collection('mockSessions').createIndex({ id: 1 }, { unique: true });
  await db.collection('mockSessions').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('mockSessions').createIndex({ userId: 1, status: 1 });
  console.log('  mockSessions ✓');

  // ── practiceAttempts ───────────────────────────────────────────────────────
  await db.collection('practiceAttempts').createIndex({ id: 1 }, { unique: true });
  await db.collection('practiceAttempts').createIndex({ userId: 1 });
  await db.collection('practiceAttempts').createIndex({ mcqId: 1 });
  await db.collection('practiceAttempts').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('practiceAttempts').createIndex({ createdAt: -1 });
  console.log('  practiceAttempts ✓');

  // ── courses ────────────────────────────────────────────────────────────────
  await db.collection('courses').createIndex({ id: 1 }, { unique: true });
  await db.collection('courses').createIndex({ slug: 1 }, { unique: true });
  await db.collection('courses').createIndex({ status: 1 });
  await db.collection('courses').createIndex({ examId: 1 });
  await db.collection('courses').createIndex({ type: 1 });
  await db.collection('courses').createIndex({ teacherIds: 1 });
  await db.collection('courses').createIndex({ status: 1, examId: 1, createdAt: -1 });
  await db.collection('courses').createIndex({ status: 1, type: 1, createdAt: -1 });
  await db.collection('courses').createIndex({ createdAt: -1 });
  console.log('  courses ✓');

  // ── courseSubjects ─────────────────────────────────────────────────────────
  await db.collection('courseSubjects').createIndex({ id: 1 }, { unique: true });
  await db.collection('courseSubjects').createIndex({ courseId: 1, order: 1 });
  console.log('  courseSubjects ✓');

  // ── courseTopics ───────────────────────────────────────────────────────────
  await db.collection('courseTopics').createIndex({ id: 1 }, { unique: true });
  await db.collection('courseTopics').createIndex({ courseSubjectId: 1, order: 1 });
  await db.collection('courseTopics').createIndex({ courseId: 1 });
  console.log('  courseTopics ✓');

  // ── courseLessons ──────────────────────────────────────────────────────────
  await db.collection('courseLessons').createIndex({ id: 1 }, { unique: true });
  await db.collection('courseLessons').createIndex({ courseTopicId: 1, order: 1 });
  await db.collection('courseLessons').createIndex({ courseId: 1 });
  console.log('  courseLessons ✓');

  // ── enrollments ────────────────────────────────────────────────────────────
  // Flat collection (replaces Firestore subcollection courses/{id}/enrollments)
  await db.collection('enrollments').createIndex({ id: 1 }, { unique: true });
  await db.collection('enrollments').createIndex({ courseId: 1, userId: 1 }, { unique: true });
  await db.collection('enrollments').createIndex({ userId: 1, status: 1 });
  await db.collection('enrollments').createIndex({ courseId: 1, status: 1 });
  await db.collection('enrollments').createIndex({ courseId: 1, status: 1, lastAccessedAt: -1 });
  console.log('  enrollments ✓');

  // ── liveSessions ───────────────────────────────────────────────────────────
  await db.collection('liveSessions').createIndex({ id: 1 }, { unique: true });
  await db.collection('liveSessions').createIndex({ courseId: 1, scheduledAt: 1 });
  await db.collection('liveSessions').createIndex({ teacherId: 1, scheduledAt: -1 });
  await db.collection('liveSessions').createIndex({ status: 1, scheduledAt: 1 });
  await db.collection('liveSessions').createIndex({ courseId: 1, status: 1, scheduledAt: 1 });
  console.log('  liveSessions ✓');

  // ── courseAnnouncements ────────────────────────────────────────────────────
  await db.collection('courseAnnouncements').createIndex({ id: 1 }, { unique: true });
  await db.collection('courseAnnouncements').createIndex({ courseId: 1, createdAt: -1 });
  console.log('  courseAnnouncements ✓');

  // ── notifications ──────────────────────────────────────────────────────────
  await db.collection('notifications').createIndex({ id: 1 }, { unique: true });
  await db.collection('notifications').createIndex({ userId: 1, isRead: 1, createdAt: -1 });
  console.log('  notifications ✓');

  await client.close();
  console.log('\n✓ All indexes created.');
}

setup().catch((err) => { console.error(err); process.exit(1); });
