import { GraduationCap, FileCheck2, NotebookPen, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// The platform's 4 real pillars, per exam — not generic feature bullets. Courses are the
// only one not live yet (no payment integration exists); test series/mocks, blogs, and MCQ
// practice are all real, working features today.
const FEATURES = [
  { icon: GraduationCap, title: 'Courses', description: 'Structured, paid courses per exam.', comingSoon: true },
  { icon: FileCheck2, title: 'Test Series & Mocks', description: 'Full-length mocks — hosted by us or by verified tutors.' },
  { icon: NotebookPen, title: 'Blogs', description: 'Concept explainers and syllabus updates, mapped to your exam.' },
  { icon: Target, title: 'MCQ Practice', description: 'Topic-wise and PYQ practice with instant explanations.' },
];

export function FeatureStrip() {
  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6 lg:px-8 lg:mb-2">
      <div className="grid grid-cols-2 divide-y divide-border rounded-2xl border border-border bg-card shadow-sm sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description, comingSoon }) => (
          <div key={title} className="flex flex-col items-center gap-2 p-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-body-md font-semibold text-foreground">{title}</p>
              {comingSoon && <Badge variant="warning">Coming Soon</Badge>}
            </div>
            <p className="text-body-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
