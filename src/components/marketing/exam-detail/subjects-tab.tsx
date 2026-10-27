import Link from 'next/link';
import { ListChecks, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SyllabusNode } from '@/server/repositories/taxonomy.repository';

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

interface SubjectsTabProps {
  syllabus: SyllabusNode[];
  subjectCount: number;
  topicCount: number;
  examSlug: string;
}

export function SubjectsTab({ syllabus, subjectCount, topicCount, examSlug }: SubjectsTabProps) {
  return (
    <div>
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ListChecks className="h-4 w-4" />
        </div>
        <div>
          <p className="text-label-caps uppercase text-muted-foreground">Coverage</p>
          <p className="text-body-md font-semibold text-foreground">
            {subjectCount} subjects · {topicCount} topics
          </p>
        </div>
      </div>

      <h2 className="text-headline-md mt-8 text-foreground">Syllabus</h2>
      {syllabus.length === 0 ? (
        <p className="text-body-sm mt-2 text-muted-foreground">Syllabus for this exam hasn&apos;t been added yet.</p>
      ) : (
        <>
          <div className="mt-4 rounded-lg border border-border p-4">
            <SyllabusTree nodes={syllabus} />
          </div>

          <div className="mt-6 flex justify-center">
            <Button className="text-label-caps rounded-full uppercase tracking-wider" asChild>
              <Link href={`/practice/exams/${examSlug}/questions`}>
                Practice This Syllabus <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
