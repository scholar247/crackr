import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Clock, ListChecks, Calculator } from 'lucide-react';
import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';
import { Hero } from '@/components/marketing/exam-detail/hero';
import { PrepDashboard } from '@/components/marketing/exam-detail/prep-dashboard';
import { ExamTabs } from '@/components/marketing/exam-detail/exam-tabs';
import { SubjectsTab } from '@/components/marketing/exam-detail/subjects-tab';

export const dynamic = 'force-dynamic';

async function getExam(slug: string) {
  const exam = await taxonomyRepository.findExamBySlug(slug);
  if (!exam || exam.status !== 'ACTIVE') return null;
  const [program, syllabus] = await Promise.all([
    taxonomyRepository.findProgramById(exam.programId),
    taxonomyRepository.getSyllabusTree(exam.id),
  ]);
  return { exam, program, syllabus };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getExam(slug);
  if (!data) return {};
  return { title: data.exam.name, description: data.exam.description ?? undefined };
}

function countByType(nodes: SyllabusNode[], type: string): number {
  return nodes.reduce((sum, n) => sum + (n.nodeType === type ? 1 : 0) + countByType(n.children, type), 0);
}

function BlueprintCard({
  icon,
  label,
  value,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-label-caps uppercase text-muted-foreground">{label}</p>
        <p className="text-body-md font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

interface ExamDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ExamDetailPage({ params, searchParams }: ExamDetailPageProps) {
  const [{ slug }, { tab }] = await Promise.all([params, searchParams]);
  const data = await getExam(slug);
  if (!data) notFound();

  const { exam, program, syllabus } = data;
  const subjectCount = syllabus.length;
  const topicCount = countByType(syllabus, 'TOPIC') + countByType(syllabus, 'SUBTOPIC');

  return (
    <main>
      <Hero exam={exam} program={program} />

      <ExamTabs
        defaultTab={tab}
        overview={
          <>
            <div>
              <h2 className="text-headline-lg text-foreground">{exam.name} Blueprint</h2>
              <p className="text-body-md mt-2 max-w-2xl text-muted-foreground">
                Understand the exact structural requirements and scoring dynamics to optimize your attempt strategy.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <BlueprintCard icon={<Clock className="h-4 w-4" />} label="Duration" value="120 minutes" />
                <BlueprintCard
                  icon={<ListChecks className="h-4 w-4" />}
                  label="Coverage"
                  value={`${subjectCount} subjects · ${topicCount} topics`}
                  active
                />
                <BlueprintCard icon={<Calculator className="h-4 w-4" />} label="Marking" value="+4 / -1 per question" />
              </div>
            </div>

            <PrepDashboard />
          </>
        }
        subjects={<SubjectsTab syllabus={syllabus} subjectCount={subjectCount} topicCount={topicCount} examSlug={exam.slug} />}
      />
    </main>
  );
}
