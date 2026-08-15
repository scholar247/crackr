import { FileText, History, Target, Trophy } from 'lucide-react';

const FEATURES = [
  { icon: FileText, title: 'Structured Theory', description: 'Concept notes organized by syllabus.' },
  { icon: History, title: 'Years of PYQs', description: 'Topic-wise past exam questions.' },
  { icon: Target, title: 'Adaptive Practice', description: 'Questions matching your level.' },
  { icon: Trophy, title: 'All-India Mocks', description: 'Real exam interface & percentiles.' },
];

export function FeatureStrip() {
  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6 lg:px-8 lg:mb-2">
      <div className="grid grid-cols-2 divide-y divide-border rounded-2xl border border-border bg-card shadow-sm sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col items-center gap-2 p-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-body-md font-semibold text-foreground">{title}</p>
            <p className="text-body-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
