import { SITE_NAME } from '@/lib/site-config';
import { Badge } from '@/components/ui/badge';

const STEPS = [
  { title: 'Choose Exam', description: 'NIMCET, GATE-CSE, CUET-UG or CBSE — pick your target.' },
  { title: 'Learn Concepts', description: 'Structured theory, revision notes & formula sheets by chapter.' },
  { title: 'Practice', description: 'Topic-wise MCQs and PYQs, with instant explanations.' },
  { title: 'Take Mocks', description: 'Full mocks hosted by us or by a verified tutor.' },
  { title: 'Enrol in a Course', description: 'A guided, syllabus-mapped course per exam.', comingSoon: true },
];

export function FrameworkSteps() {
  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-headline-lg text-foreground">The {SITE_NAME} Framework</h2>
          <p className="text-body-md mx-auto mt-2 max-w-2xl text-muted-foreground">
            We built this the way we&apos;d have wanted it when we were prepping for NIMCET and GATE ourselves: learn the
            concept once, drill it until it&apos;s automatic, then test it under real exam conditions — no step skipped,
            no guesswork about what to do next.
          </p>
        </div>

        <div className="relative mt-14 flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="absolute left-0 right-0 top-5 hidden h-px bg-border sm:block" aria-hidden="true" />
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative z-10 flex flex-col items-center gap-2 text-center sm:flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background text-body-md font-semibold text-primary">
                {i + 1}
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-body-md font-semibold text-foreground">{step.title}</p>
                {step.comingSoon && <Badge variant="warning">Soon</Badge>}
              </div>
              <p className="text-body-sm max-w-[150px] text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
