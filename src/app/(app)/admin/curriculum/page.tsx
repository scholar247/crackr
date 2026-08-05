import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';
import { CurriculumClient } from './curriculum-client';

export default async function AdminCurriculumPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'ADMIN')) {
    redirect('/dashboard');
  }

  return <CurriculumClient />;
}
