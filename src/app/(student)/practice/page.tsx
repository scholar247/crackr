import { Metadata } from 'next';
import { PracticeBrowser } from './practice-browser';
import { SectionErrorBoundary } from '@/components/shared/section-error';

export const metadata: Metadata = {
  title: 'Practice | crackr',
  description: 'Practice MCQs filtered by subject, difficulty, and topic with instant explanations.',
};

export default function PracticePage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-muted-foreground mt-1">Browse and practice questions from the bank</p>
      </div>
      <SectionErrorBoundary>
        <PracticeBrowser />
      </SectionErrorBoundary>
    </div>
  );
}
