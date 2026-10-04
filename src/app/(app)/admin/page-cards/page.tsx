import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';
import { PageCardsClient } from './page-cards-client';

export default async function AdminPageCardsPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'ADMIN')) {
    redirect('/dashboard');
  }

  return <PageCardsClient />;
}
