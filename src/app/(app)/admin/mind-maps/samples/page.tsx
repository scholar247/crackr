import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';
import { SamplesClient } from './samples-client';

export const metadata: Metadata = { title: 'Mind map samples', robots: { index: false, follow: false } };

export default async function MindMapSamplesPage() {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'ADMIN')) redirect('/dashboard');
  return <SamplesClient />;
}
