import { Metadata } from 'next';
import { requireAuth } from '@/lib/api-helpers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminReportsClient } from './admin-reports-client';

export const metadata: Metadata = { title: 'Reports | Admin' };

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide analytics, test performance, and data exports
        </p>
      </div>
      <AdminReportsClient />
    </div>
  );
}
