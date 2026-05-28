import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/server-fetch';
import { MCQForm } from '@/components/editor/mcq-form';

export const metadata: Metadata = { title: 'Edit MCQ' };

export default async function EditMCQPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mcq = await serverGet<any>(`/api/admin/mcq/${id}`).catch(() => null);
  if (!mcq) notFound();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit MCQ</h1>
        <p className="text-muted-foreground mt-1">Update question content and settings</p>
      </div>
      <MCQForm mode="edit" initialData={mcq} />
    </div>
  );
}
