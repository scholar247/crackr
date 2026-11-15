import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';
import { NotificationsClient } from './notifications-client';

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'ADMIN')) {
    redirect('/dashboard');
  }

  return <NotificationsClient />;
}
