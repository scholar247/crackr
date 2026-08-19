import { SITE_NAME } from '@/lib/site-config';

const STEPS = [
  { title: 'Choose Exam', description: 'Select your target' },
  { title: 'Learn Concepts', description: 'Study theory & notes' },
  { title: 'Practice', description: 'Solve topic-wise MCQs' },
  { title: 'Take Mocks', description: 'Full-length tests' },
  { title: 'Analyze', description: 'Review performance' },
];

export function FrameworkSteps() {
  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-headline-lg text-foreground">The {SITE_NAME} Framework</h2>
          <p className="text-body-md mx-auto mt-2 max-w-xl text-muted-foreground">
            A proven, systematic approach to cracking competitive exams.
          </p>
        </div>

        <div className="relative mt-14 flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="absolute left-0 right-0 top-5 hidden h-px bg-border sm:block" aria-hidden="true" />
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative z-10 flex flex-col items-center gap-2 text-center sm:flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background text-body-md font-semibold text-primary">
                {i + 1}
              </div>
              <p className="text-body-md font-semibold text-foreground">{step.title}</p>
              <p className="text-body-sm max-w-[140px] text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
