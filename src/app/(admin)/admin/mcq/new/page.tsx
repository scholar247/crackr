import { Metadata } from 'next';
import { MCQForm } from '@/components/editor/mcq-form';

export const metadata: Metadata = { title: 'New MCQ' };

export default function NewMCQPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create MCQ</h1>
        <p className="text-muted-foreground mt-1">Add a new question to the bank</p>
      </div>
      <MCQForm mode="create" />
    </div>
  );
}
