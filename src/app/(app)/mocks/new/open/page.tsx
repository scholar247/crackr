import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { OpenMockForm } from '@/components/mocks/open-mock-form';

export default async function NewOpenMockPage() {
  const rows = await taxonomyRepository.listPublicExams();
  const examOptions = rows.map(({ exam, programName }) => ({ id: exam.id, name: exam.name, programName }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">New open mock</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Published for every subject of the exam at once, open to anyone targeting it — not a hand-picked invite list.
      </p>
      <div className="mt-6">
        <OpenMockForm examOptions={examOptions} />
      </div>
    </div>
  );
}
