import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';
import { UsersListClient } from './users-list-client';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'ADMIN')) {
    redirect('/dashboard');
  }

  return <UsersListClient />;
}
