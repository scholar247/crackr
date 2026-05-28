import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { TestBuilderClient } from '../../test-builder-client';

export const metadata: Metadata = { title: 'Edit Test' };

export default async function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await serverGet<any>(`/api/admin/tests/${id}`).catch(() => null);
  if (!test) notFound();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Test</h1>
        <p className="text-muted-foreground mt-1">{test.title}</p>
      </div>
      <TestBuilderClient mode="edit" initialData={test} />
    </div>
  );
}
