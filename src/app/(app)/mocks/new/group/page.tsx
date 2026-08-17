import { auth } from '@/lib/auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { audienceRepository } from '@/server/repositories/audience.repository';
import { canInviteAudience } from '@/lib/roles';
import { GroupTestWizard } from '@/components/mocks/group-test-wizard';

export default async function NewGroupTestPage() {
  const session = await auth();
  const canAssignByGroup = canInviteAudience(session!.user.role);

  const [examRows, audiences] = await Promise.all([
    taxonomyRepository.listPublicExams(),
    canAssignByGroup ? audienceRepository.listActive() : Promise.resolve([]),
  ]);
  const examOptions = examRows.map(({ exam, programName }) => ({ id: exam.id, name: exam.name, programName }));
  const audienceOptions = audiences.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">New group test</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Build the test, invite people, and set a schedule.</p>
      <div className="mt-6">
        <GroupTestWizard examOptions={examOptions} audienceOptions={audienceOptions} canAssignByGroup={canAssignByGroup} />
      </div>
    </div>
  );
}
