import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';
import { SamplePapersClient } from './sample-papers-client';

export default async function AdminSamplePapersPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'ADMIN')) {
    redirect('/dashboard');
  }

  return <SamplePapersClient />;
}
