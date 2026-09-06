import Link from 'next/link';
import { Layers, GraduationCap, ArrowRight } from 'lucide-react';

interface SubjectShortcut {
  id: string;
  name: string;
}

interface ExamShortcut {
  examSlug: string;
  examName: string;
}

interface PracticeShortcutsProps {
  examSlug: string;
  subjects: SubjectShortcut[];
  exams: ExamShortcut[];
}

// New section: two jump-in groups. "By Subject" scopes practice to one subject of the
// primary exam (practice-browser.tsx reads ?subject= on mount to seed its picker — see
// that file's comment); "By Exam" jumps straight into an exam's full, unscoped question
// pool (already the default behavior of /practice/exams/{slug}/questions with no params).
export function PracticeShortcuts({ examSlug, subjects, exams }: PracticeShortcutsProps) {
  if (subjects.length === 0 && exams.length === 0) return null;

  return (
    <section className="bg-background py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-headline-lg text-foreground">Jump Into Practice</h2>
        <p className="text-body-md mt-1 text-muted-foreground">Pick a subject, or go straight to an exam&apos;s full question pool.</p>

        {subjects.length > 0 && (
          <div className="mt-6">
            <p className="text-label-caps flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5" /> By Subject
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/practice/exams/${examSlug}/questions?subject=${subject.id}`}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  {subject.name}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {exams.length > 0 && (
          <div className="mt-6">
            <p className="text-label-caps flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" /> By Exam
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {exams.map((exam) => (
                <Link
                  key={exam.examSlug}
                  href={`/practice/exams/${exam.examSlug}/questions`}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  {exam.examName}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
