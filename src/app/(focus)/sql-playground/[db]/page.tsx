import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findSqlTemplate } from '@/lib/sql-playground/templates';
import { SqlPlayground } from '@/components/sql-playground/sql-playground';

type Props = { params: Promise<{ db: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = findSqlTemplate((await params).db);
  return { title: template ? `${template.name} · SQL Playground` : 'SQL Playground' };
}

// Full-screen editor — lives in the (focus) group so it gets the auth guard without the
// app shell's sidebar, same as the exam room.
export default async function SqlPlaygroundEditorPage({ params }: Props) {
  const template = findSqlTemplate((await params).db);
  if (!template) notFound();

  return <SqlPlayground template={template} />;
}
