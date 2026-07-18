import { Metadata } from 'next';
import { AIFactoryClient } from './ai-factory-client';

export const metadata: Metadata = { title: 'AI Content Factory' };

export default function AIFactoryPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Content Factory</h1>
        <p className="text-muted-foreground mt-1">
          Queue AI-assisted draft generation for Blogs and MCQs. This only creates pending seeds —
          nothing is generated or published automatically.
        </p>
      </div>
      <AIFactoryClient />
    </div>
  );
}
