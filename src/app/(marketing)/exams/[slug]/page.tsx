import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { taxonomyRepository, type SyllabusNode } from '@/server/repositories/taxonomy.repository';

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
  return { title: data.exam.name, description: data.exam.description ?? undefined };
}

function SyllabusTree({ nodes, depth = 0 }: { nodes: SyllabusNode[]; depth?: number }) {
  if (nodes.length === 0) return null;
  return (
    <ul className={depth > 0 ? 'ml-4 border-l border-border pl-4' : ''}>
      {nodes.map((node) => (
        <li key={node.id} className="py-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{node.nodeType}</span>
            <span className="text-sm text-foreground">{node.name}</span>
          </div>
          <SyllabusTree nodes={node.children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

export default async function ExamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getExam(slug);
  if (!data) notFound();

  const { exam, syllabus } = data;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{exam.name}</h1>
      {exam.description && <p className="mt-2 text-muted-foreground">{exam.description}</p>}

      <h2 className="mt-10 text-lg font-semibold text-foreground">Syllabus</h2>
      {syllabus.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Syllabus for this exam hasn&apos;t been added yet.</p>
      ) : (
        <div className="mt-4 rounded-xl border border-border p-4">
          <SyllabusTree nodes={syllabus} />
        </div>
      )}
    </main>
  );
}
