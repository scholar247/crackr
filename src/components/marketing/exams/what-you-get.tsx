import { BookOpen, FileCheck2, History, ListChecks } from 'lucide-react';

interface WhatYouGetProps {
  totals: { chapters: number; mcqs: number; pyqs: number; mockTests: number; exams: number };
}

const fmt = (n: number) => n.toLocaleString('en-IN');

// Sets expectations before someone commits to an exam: what's inside every exam page, with
// the platform's real totals (a number is only quoted when there is one).
export function WhatYouGet({ totals }: WhatYouGetProps) {
  const items = [
    {
      icon: BookOpen,
      title: 'Syllabus, chapter by chapter',
      body:
        totals.chapters > 0
          ? `${fmt(totals.chapters)} chapters mapped across ${fmt(totals.exams)} exams.`
          : 'Every subject and chapter laid out for the exam.',
    },
    {
      icon: ListChecks,
      title: 'Topic-wise MCQ practice',
      body:
        totals.mcqs > 0
          ? `${fmt(totals.mcqs)} questions with explanations on every answer.`
          : 'Practice questions with explanations on every answer.',
    },
    {
      icon: History,
      title: 'Previous-year questions',
      body: totals.pyqs > 0 ? `${fmt(totals.pyqs)} PYQs tagged to their exam and topic.` : 'Past-paper questions tagged to exam and topic.',
    },
    {
      icon: FileCheck2,
      title: 'Mock tests with ranks',
      body:
        totals.mockTests > 0
          ? `${fmt(totals.mockTests)} timed mocks with a ranked report after each attempt.`
          : 'Timed mocks with a ranked report after each attempt.',
    },
  ];

  return (
    <section className="bg-muted/40 py-14 lg:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-label-caps uppercase tracking-wider text-primary">What you get</p>
          <h2 className="text-headline-lg mt-1 text-foreground">Pick an exam and everything is in one place</h2>
          <p className="text-body-md mt-2 text-muted-foreground">
            Each exam page brings the syllabus, practice, past papers and mocks together.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-body-md mt-4 font-semibold text-foreground">{title}</p>
              <p className="text-body-sm mt-1 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
