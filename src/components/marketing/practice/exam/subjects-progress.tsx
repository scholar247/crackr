import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  topicCount: number;
  questionCount: number;
}

// Illustrative — no attempt-tracking is wired yet, same caveat as hero.tsx's snapshot.
// Cycled per subject rather than keyed by name, purely to show visual variety.
const MASTERY_CYCLE = [
  { percent: 68, label: 'Focus Required', tone: 'warning' as const },
  { percent: 82, label: 'Strong', tone: 'success' as const },
  { percent: 45, label: 'Needs Work', tone: 'danger' as const },
  { percent: 90, label: 'Excellent', tone: 'success' as const },
];

const TONE_BAR: Record<string, string> = {
  warning: 'bg-warning',
  success: 'bg-secondary',
  danger: 'bg-destructive',
};
const TONE_TEXT: Record<string, string> = {
  warning: 'text-warning',
  success: 'text-secondary',
  danger: 'text-destructive',
};

export async function SubjectsProgress({ subjects }: { subjects: Subject[] }) {
  const session = await auth();

  if (subjects.length === 0) return null;

  return (
    <section className="bg-muted/40 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-headline-lg text-foreground">Subjects</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {subjects.map((subject, i) => {
            const mastery = MASTERY_CYCLE[i % MASTERY_CYCLE.length];
            return (
              <div key={subject.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-body-md font-semibold text-foreground">{subject.name}</p>
                  <span className="text-body-sm text-muted-foreground">
                    {subject.questionCount > 0 ? `${subject.questionCount} Qs · ` : ''}
                    {subject.topicCount} Topics
                  </span>
                </div>

                {session?.user ? (
                  <>
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div className={cn('h-full rounded-full', TONE_BAR[mastery.tone])} style={{ width: `${mastery.percent}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-body-sm">
                      <span className="text-muted-foreground">{mastery.percent}% Mastery</span>
                      <span className={TONE_TEXT[mastery.tone]}>{mastery.label}</span>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 h-1.5 w-full rounded-full bg-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
