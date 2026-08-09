import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, ChevronRight, Star, Download, Clock, ListChecks, Calculator } from 'lucide-react';
import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';
import { QuizPreviewCard } from '@/components/marketing/quiz-preview-card';
import { Button } from '@/components/ui/button';

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

function SyllabusTree({ nodes, depth = 0 }: { nodes: SyllabusNode[]; depth?: number }) {
  if (nodes.length === 0) return null;
  return (
    <ul className={depth > 0 ? 'ml-4 border-l border-border pl-4' : ''}>
      {nodes.map((node) => (
        <li key={node.id} className="py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-label-caps rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{node.nodeType}</span>
            <span className="text-body-sm text-foreground">{node.name}</span>
          </div>
          <SyllabusTree nodes={node.children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

const AVATAR_TINTS = ['bg-primary/20 text-primary', 'bg-secondary/20 text-secondary', 'bg-tertiary/20 text-tertiary'];

function AvatarStack() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {AVATAR_TINTS.map((tint, i) => (
          <div
            key={i}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[11px] font-semibold ${tint}`}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground">
          +12k
        </div>
      </div>
      <span className="text-body-sm text-muted-foreground">Aspirants joined this week</span>
    </div>
  );
}

export default async function ExamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getExam(slug);
  if (!data) notFound();

  const { exam, program, syllabus } = data;
  const subjectCount = syllabus.length;
  const topicCount = countByType(syllabus, 'TOPIC') + countByType(syllabus, 'SUBTOPIC');

  return (
    <main>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-1.5 text-body-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/exams" className="hover:text-foreground">
            Exams
          </Link>
          {program && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span>{program.name}</span>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{exam.name}</span>
        </nav>
      </div>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-14">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-label-caps uppercase text-muted-foreground">4.9/5 rating | 50,000+ aspirants</span>
          </div>

          <h1 className="text-display-lg mt-6 text-foreground">
            Free <span className="text-gradient-brand">{exam.name}</span>{' '}
            Mock Tests, Chapterwise MCQs &amp; PYPs
          </h1>

          <p className="text-body-lg mt-6 max-w-xl text-muted-foreground">
            {exam.description ??
              `Master the ${exam.name} pattern with structured chapterwise practice, full-length mocks, and previous year papers mapped to the exact syllabus.`}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href="/sign-in">
                Attempt Free {exam.name} Full Mock <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-label-caps rounded-full uppercase tracking-wider">
              <Download className="h-4 w-4" /> Syllabus PDF
            </Button>
          </div>

          <div className="mt-6">
            <AvatarStack />
          </div>
        </div>

        <QuizPreviewCard
          glow
          eyebrow="Live Challenge"
          timer="00:45"
          title="Set Theory Challenge"
          question="If A and B are two sets such that n(A) = 70, n(B) = 60 and n(A ∪ B) = 110, then find n(A ∩ B)."
          correctKey="B"
          options={[
            { key: 'A', text: '10' },
            { key: 'B', text: '20' },
            { key: 'C', text: '30' },
            { key: 'D', text: '40' },
          ]}
          solution="By the inclusion-exclusion principle: n(A ∩ B) = n(A) + n(B) − n(A ∪ B) = 70 + 60 − 110 = 20."
        />
      </section>

      <section className="relative overflow-hidden border-t border-border py-16">
        <span
          className="text-display-lg pointer-events-none absolute -right-4 -top-4 select-none font-black text-muted-foreground/5 sm:text-[6rem]"
          aria-hidden="true"
        >
          SPECS
        </span>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-headline-lg text-foreground">{exam.name} Blueprint</h2>
          <p className="text-body-md mt-2 max-w-2xl text-muted-foreground">
            Understand the exact structural requirements and scoring dynamics to optimize your attempt strategy.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <BlueprintCard icon={<Clock className="h-4 w-4" />} number="01" label="Duration" value="120 minutes" />
            <BlueprintCard
              icon={<ListChecks className="h-4 w-4" />}
              number="02"
              label="Coverage"
              value={`${subjectCount} subjects · ${topicCount} topics`}
              active
            />
            <BlueprintCard icon={<Calculator className="h-4 w-4" />} number="03" label="Marking" value="+4 / -1 per question" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-headline-md text-foreground">Syllabus</h2>
        {syllabus.length === 0 ? (
          <p className="text-body-sm mt-2 text-muted-foreground">Syllabus for this exam hasn&apos;t been added yet.</p>
        ) : (
          <div className="mt-4 rounded-lg border border-border p-4">
            <SyllabusTree nodes={syllabus} />
          </div>
        )}
      </div>
    </main>
  );
}

function countByType(nodes: SyllabusNode[], type: string): number {
  return nodes.reduce((sum, n) => sum + (n.nodeType === type ? 1 : 0) + countByType(n.children, type), 0);
}

function BlueprintCard({
  icon,
  number,
  label,
  value,
  active = false,
}: {
  icon: React.ReactNode;
  number: string;
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-4">
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
      <span className="text-display-lg font-black text-muted-foreground/20">{number}</span>
    </div>
  );
}
