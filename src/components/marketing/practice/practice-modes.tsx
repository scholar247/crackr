import Link from 'next/link';
import { List, BookOpen, ClipboardCheck, History, Shuffle, Timer } from 'lucide-react';

const MODES = [
  { icon: List, title: 'Topic-wise Practice', description: 'Drill down into specific chapters and sub-topics to isolate weaknesses.' },
  { icon: BookOpen, title: 'Subject-wise Practice', description: 'Comprehensive sets covering entire subjects to build broad proficiency.' },
  { icon: ClipboardCheck, title: 'Exam-specific Practice', description: 'Curated questions modeled strictly on the syllabus and pattern of your target exam.' },
  { icon: History, title: 'Previous Year Questions', description: 'Attempt actual questions from past papers to understand examiner intent.' },
  { icon: Shuffle, title: 'Mixed Practice', description: 'Randomized sets across subjects to build context-switching agility.' },
  { icon: Timer, title: 'Timed Sprints', description: 'High-pressure short sets to improve speed and decision-making under stress.' },
];

export function PracticeModes() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-headline-lg text-foreground">Explore Practice Modes</h2>
        <p className="text-body-md mt-1 text-muted-foreground">Select a format that fits your current study objective.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map(({ icon: Icon, title, description }) => (
            <Link
              key={title}
              href="/exams"
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-body-md mt-3 font-semibold text-foreground">{title}</p>
              <p className="text-body-sm mt-1 text-muted-foreground">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
