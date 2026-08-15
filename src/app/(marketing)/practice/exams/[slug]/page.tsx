import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';
import { questionRepository } from '@/server/repositories/question.repository';
import { auth } from '@/lib/auth';
import { Hero } from '@/components/marketing/practice/exam/hero';
import { PracticeModeCards } from '@/components/marketing/practice/exam/practice-mode-cards';
import { SubjectsProgress } from '@/components/marketing/practice/exam/subjects-progress';
import { NeedsAttention } from '@/components/marketing/practice/exam/needs-attention';
import { TopicExplorer, type ExplorerTopic } from '@/components/marketing/practice/exam/topic-explorer';
import { QuizPreviewCard } from '@/components/marketing/quiz-preview-card';

export const dynamic = 'force-dynamic';

async function getExam(slug: string) {
  const exam = await taxonomyRepository.findExamBySlug(slug);
  if (!exam || exam.status !== 'ACTIVE') return null;
  const syllabus = await taxonomyRepository.getSyllabusTree(exam.id);
  return { exam, syllabus };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getExam(slug);
  if (!data) return {};
  return { title: `Practice ${data.exam.name}` };
}

function collectTopics(nodes: SyllabusNode[], subjectName: string): { id: string; name: string; subjectName: string }[] {
  return nodes.flatMap((n) => [
    ...(n.nodeType === 'TOPIC' ? [{ id: n.id, name: n.name, subjectName }] : []),
    ...collectTopics(n.children, subjectName),
  ]);
}

export default async function PracticeExamLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getExam(slug);
  if (!data) notFound();

  const { exam, syllabus } = data;
  const session = await auth();

  const allTopics = syllabus.flatMap((subject) => collectTopics(subject.children, subject.name));

  const [examQuestionCount, subjectQuestionCounts, topicQuestionCounts, sampleQuestions] = await Promise.all([
    questionRepository.listPublished({ examId: exam.id }).then((rows) => rows.length),
    Promise.all(
      syllabus.map(async (subject) => [subject.id, (await questionRepository.listPublished({ nodeId: subject.id })).length] as const)
    ),
    Promise.all(
      allTopics.map(async (topic) => [topic.id, (await questionRepository.listPublished({ nodeId: topic.id })).length] as const)
    ),
    questionRepository.listPublished({ examId: exam.id, difficulty: 'HARD' }),
  ]);

  const subjectQuestionCountById = new Map(subjectQuestionCounts);
  const topicQuestionCountById = new Map(topicQuestionCounts);

  const subjects = syllabus.map((subject) => ({
    id: subject.id,
    name: subject.name,
    topicCount: collectTopics(subject.children, subject.name).length,
    questionCount: subjectQuestionCountById.get(subject.id) ?? 0,
  }));

  const explorerTopics: ExplorerTopic[] = allTopics.map((topic) => ({
    id: topic.id,
    name: topic.name,
    subjectName: topic.subjectName,
    questionCount: topicQuestionCountById.get(topic.id) ?? 0,
  }));

  // Fall back to any difficulty if this exam has no HARD-tagged question yet.
  const sampleQuestion = sampleQuestions[0] ?? (await questionRepository.listPublished({ examId: exam.id })).at(0);

  return (
    <main>
      <Hero examName={exam.name} examSlug={exam.slug} questionCount={examQuestionCount} topicCount={allTopics.length} />
      <PracticeModeCards examSlug={exam.slug} />
      <SubjectsProgress subjects={subjects} />

      <section className="bg-muted/40 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
          <div>
            <h2 className="text-headline-lg text-foreground">Question Preview</h2>
            <p className="text-body-md mt-1 text-muted-foreground">A sample of what you&apos;ll practice with.</p>
            <div className="mt-6 max-w-xl">
              {sampleQuestion ? (
                <QuizPreviewCard
                  glow
                  eyebrow={exam.name}
                  timer={sampleQuestion.difficulty}
                  question={sampleQuestion.stem}
                  correctKey={sampleQuestion.optionsJson.find((o) => o.isCorrect)?.key ?? sampleQuestion.optionsJson[0]?.key}
                  options={sampleQuestion.optionsJson.map((o) => ({ key: o.key, text: o.text }))}
                  solution={sampleQuestion.explanation ?? undefined}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-body-sm text-muted-foreground">
                  Questions for {exam.name} are coming soon.
                </div>
              )}
            </div>
          </div>

          {session?.user && (
            <div>
              <NeedsAttention />
            </div>
          )}
        </div>
      </section>

      <TopicExplorer subjects={syllabus.map((s) => s.name)} topics={explorerTopics} examSlug={exam.slug} loggedIn={!!session?.user} />
    </main>
  );
}
