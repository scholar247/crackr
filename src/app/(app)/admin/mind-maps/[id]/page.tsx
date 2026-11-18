import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole } from '@/lib/roles';
import { MindMapEditor } from './mind-map-editor';

export default async function AdminMindMapEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'ADMIN')) redirect('/dashboard');
  return <MindMapEditor id={(await params).id} />;
}
