import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';
import { isAdmin } from '@/lib/roles';
import { CommunityForm } from '@/components/community/community-form';

export default async function NewCommunityPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=%2Fcommunities%2Fnew');

  const admin = isAdmin(session.user.role);
  const rows = admin ? await taxonomyRepository.listPublicExams() : [];
  const examOptions = rows.map(({ exam, programName }) => ({ id: exam.id, name: exam.name, programName }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">New community</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Start a space to discuss, ask questions, and share solutions.</p>
      <div className="mt-6">
        <CommunityForm examOptions={examOptions} isAdmin={admin} />
      </div>
    </div>
  );
}
