import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BookOpen, Newspaper, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'scholar247 — Learn, Practice, Progress, Crack Exams',
  description:
    'The smartest way to prepare for competitive exams. Practice curated question banks, follow structured curricula, and track your progress.',
};

const HIGHLIGHTS = [
  {
    icon: Target,
    title: 'Structured curricula',
    description: 'Exam-by-exam syllabus trees so you always know what to study next.',
  },
  {
    icon: BookOpen,
    title: 'Curated question banks',
    description: 'Reusable, topic-mapped questions shared across the exams that need them.',
  },
  {
    icon: Newspaper,
    title: 'In-depth articles',
    description: 'Written explanations and guides alongside the exams and topics they cover.',
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Learn, practice, progress, <span className="text-primary">crack</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          The smartest way to prepare for competitive exams — structured curricula, curated question banks, and guides
          written for exactly the exam you&apos;re taking.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/sign-in">
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/exams">Browse exams</Link>
          </Button>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center sm:text-left">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary sm:mx-0">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
