import { Metadata } from 'next';
import { ExamsClient } from './exams-client';

export const metadata: Metadata = { title: 'Exams | Admin' };

export default function AdminExamsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exam Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure exams and their syllabus sections
        </p>
      </div>
      <ExamsClient />
    </div>
  );
}
