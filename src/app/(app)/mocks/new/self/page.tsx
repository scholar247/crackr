import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { SelfMockWizard } from '@/components/mocks/self-mock-wizard';

export default async function NewSelfMockPage() {
  const rows = await taxonomyRepository.listPublicExams();
  const examOptions = rows.map(({ exam, programName }) => ({ id: exam.id, name: exam.name, programName }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">New self mock</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Pick an exam, build your sections, and set a marking scheme.</p>
      <div className="mt-6">
        <SelfMockWizard examOptions={examOptions} />
      </div>
    </div>
  );
}
