import Link from 'next/link';
import { Plus } from 'lucide-react';
import { auth } from '@/lib/auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { Button } from '@/components/ui/button';
import { QuestionBankBrowser } from './question-bank-browser';

export const dynamic = 'force-dynamic';

export default async function QuestionBankPage() {
  // Layout already guarantees an authenticated session; the role is only needed here to
  // gate the bulk select/publish controls (admin-only), not to gate the page itself.
  const session = await auth();
  const examRows = await taxonomyRepository.listExams();
  const exams = examRows.map(({ exam, programName }) => ({ id: exam.id, name: exam.name, programName }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-foreground">Question Bank</h1>
          <p className="text-body-sm mt-1 text-muted-foreground">Author, tag, and publish MCQs across your exam catalog.</p>
        </div>
        <Button asChild>
          <Link href="/admin/questions/new">
            <Plus className="h-4 w-4" /> Add New MCQ
          </Link>
        </Button>
      </div>

      <QuestionBankBrowser exams={exams} role={session!.user.role} />
    </div>
  );
}
