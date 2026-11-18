import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';
import { MindMapsClient } from './mind-maps-client';

export default async function AdminMindMapsPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'ADMIN')) redirect('/dashboard');
  return <MindMapsClient />;
}
