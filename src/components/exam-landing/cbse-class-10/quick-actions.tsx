import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardCheck, FileText, History, ListChecks, Zap } from 'lucide-react';

interface QuickAction {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

// "What do you want to do today?" — one tile per job a Class 10 student comes here for. Each
// tile goes straight to the place that does that job (a route or a section on this page).
export function QuickActions({
  practiceHref,
  mcqs,
  pyqs,
  hasDailyProblem,
  hasChapterPractice,
  articleCount,
  mockCount,
}: {
  practiceHref: string;
  hasChapterPractice: boolean;
  mcqs: number;
  pyqs: number;
  hasDailyProblem: boolean;
  articleCount: number;
  mockCount: number;
}) {
  const actions: QuickAction[] = [
    // Until questions are tagged to chapters, the chapter list has nothing to practise — offer mixed practice instead.
    hasChapterPractice
      ? {
          href: '#syllabus',
          icon: <ListChecks className="h-5 w-5" />,
          title: 'Practise a chapter',
          description: 'Pick a subject and chapter, then solve its questions',
        }
      : {
          href: practiceHref,
          icon: <ListChecks className="h-5 w-5" />,
          title: 'Practise mixed questions',
          description: 'Questions from every subject, with solutions',
        },
    {
      href: practiceHref,
      icon: <History className="h-5 w-5" />,
      title: 'Solve previous year questions',
      description: pyqs > 0 ? `${pyqs.toLocaleString('en-IN')} PYQs across ${mcqs.toLocaleString('en-IN')} practice questions` : 'Practice questions for every subject',
    },
    {
      href: '#practice',
      icon: <Zap className="h-5 w-5" />,
      title: 'Question of the day',
      description: hasDailyProblem ? 'One new question every day, with the solution' : 'A daily question to keep your streak going',
    },
    {
      href: '#pattern',
      icon: <FileText className="h-5 w-5" />,
      title: 'Understand the paper',
      description: 'Sections, marks and question types for each subject',
    },
    {
      href: '#notes',
      icon: <BookOpen className="h-5 w-5" />,
      title: 'Read chapter notes',
      description: articleCount > 0 ? `${articleCount} notes and guides` : 'Notes and guides, chapter by chapter',
    },
    {
      href: '#mocks',
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: 'Take a mock test',
      description: mockCount > 0 ? `${mockCount} mock${mockCount > 1 ? 's' : ''} ready to attempt` : 'Build a timed mock from any chapters',
    },
  ];

  return (
    <section className="bg-background pb-12">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <h2 className="text-headline-md text-foreground">What do you want to do today?</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((a) => {
            const isAnchor = a.href.startsWith('#');
            const className =
              'group flex h-full items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5';
            const body = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{a.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 font-semibold text-foreground">
                    {a.title}
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                  <span className="text-body-sm mt-1 block text-muted-foreground">{a.description}</span>
                </span>
              </>
            );
            return (
              <li key={a.title}>
                {isAnchor ? (
                  <a href={a.href} className={className}>
                    {body}
                  </a>
                ) : (
                  <Link href={a.href} className={className}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
