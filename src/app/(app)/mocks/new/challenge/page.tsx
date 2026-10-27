import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { ChallengeWizard } from '@/components/mocks/challenge-wizard';

export default async function NewChallengePage() {
  const rows = await taxonomyRepository.listPublicExams();
  const examOptions = rows.map(({ exam, programName }) => ({ id: exam.id, name: exam.name, programName }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">New challenge</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Build the test and challenge someone to a head-to-head.</p>
      <div className="mt-6">
        <ChallengeWizard examOptions={examOptions} />
      </div>
    </div>
  );
}
