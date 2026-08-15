import { Layers, BookMarked, History, Bookmark } from 'lucide-react';
import { QuizPreviewCard } from '@/components/marketing/quiz-preview-card';

const MODES = [
  { icon: Layers, label: 'Topic-wise', description: 'Focus on specific areas' },
  { icon: BookMarked, label: 'Subject-wise', description: 'Mixed practice' },
  { icon: History, label: 'PYQs', description: 'Previous year papers' },
  { icon: Bookmark, label: 'Bookmarks', description: 'Review saved questions' },
];

export function PracticeShowcase() {
  return (
    <section className="bg-surface-container-lowest py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <QuizPreviewCard
          glow
          eyebrow="Practice"
          timer="Q. 45"
          question="Which of the following data structures is most suitable for implementing a priority queue?"
          correctKey="B"
          options={[
            { key: 'A', text: 'Array' },
            { key: 'B', text: 'Heap' },
            { key: 'C', text: 'Linked List' },
            { key: 'D', text: 'Stack' },
          ]}
          solution="A heap gives O(log n) insert and O(1) access to the highest/lowest priority element, which is exactly what a priority queue needs — arrays, linked lists, and stacks don't offer that without extra scanning."
        />

        <div>
          <span className="text-label-caps uppercase tracking-wider text-primary">Practice</span>
          <h2 className="text-headline-lg mt-2 text-foreground">Practice Until You&apos;re Confident</h2>
          <p className="text-body-md mt-3 max-w-lg text-muted-foreground">
            Don&apos;t just read. Apply your knowledge with our extensive question banks designed to test your understanding
            at every level.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {MODES.map(({ icon: Icon, label, description }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-body-md mt-3 font-semibold text-foreground">{label}</p>
                <p className="text-body-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
